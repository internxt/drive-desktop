import * as utilModule from '@/apps/main/util';
import { DriveServerWipError } from '@/infra/drive-server-wip/defs';
import { SingleItemError } from '@/infra/sqlite/services/common/single-item-error';
import { SqliteError } from '@/infra/sqlite/services/common/sqlite-error';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { scanRecoverySyncItems } from './scan-recovery-sync-items';

describe('scan-recovery-sync-items', () => {
  const sleepMock = partialSpyOn(utilModule, 'sleep');
  const startOrResumeScanMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'startOrResumeScan');
  const commitScanPageMock = partialSpyOn(SqliteModule.RecoverySyncModule, 'commitScanPage');
  const fetchPageMock = vi.fn<Parameters<typeof scanRecoverySyncItems>[0]['fetchPage']>();
  const repairItemsMock = vi.fn<Parameters<typeof scanRecoverySyncItems>[0]['repairItems']>();

  const checkpoint = '2026-01-01T00:00:00.000Z';
  const epoch = '1970-01-01T00:00:00.000Z';

  function item(uuid: string, updatedAt: string, status: 'EXISTS' | 'TRASHED' | 'DELETED' = 'EXISTS') {
    return { uuid, updatedAt, status };
  }

  function invalidCursorError() {
    return new DriveServerWipError('UNKNOWN', 'cause', new Response(null, { status: 400 }));
  }

  let props: Parameters<typeof scanRecoverySyncItems>[0];

  beforeEach(() => {
    sleepMock.mockResolvedValue(undefined);
    startOrResumeScanMock.mockReturnValue({ data: { rootUuid: 'rootUuid', itemType: 'file', checkpoint, updatedAt: epoch, completed: 0 } });
    commitScanPageMock.mockReturnValue({ data: undefined });
    fetchPageMock.mockResolvedValue({ data: { items: [], nextCursor: null } });
    repairItemsMock.mockResolvedValue({ data: undefined });

    props = mockProps<typeof scanRecoverySyncItems>({
      ctx: { rootUuid: 'rootUuid' as any, userUuid: 'userUuid', workspaceId: 'workspaceId', abortController: new AbortController() },
      itemType: 'file',
    });
    props.fetchPage = fetchPageMock;
    props.repairItems = repairItemsMock;
  });

  it('should start the scan for the context and item type', async () => {
    // When
    await scanRecoverySyncItems(props);
    // Then
    calls(startOrResumeScanMock).toStrictEqual([
      { rootUuid: 'rootUuid', userUuid: 'userUuid', workspaceId: 'workspaceId', itemType: 'file' },
    ]);
  });

  it('should scan every page with the cursor and complete on the last one', async () => {
    // Given
    fetchPageMock
      .mockResolvedValueOnce({ data: { items: [item('a', '2025-01-01T00:00:00.000Z')], nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({ data: { items: [item('b', '2025-02-01T00:00:00.000Z', 'TRASHED')], nextCursor: 'cursor-2' } })
      .mockResolvedValueOnce({ data: { items: [item('c', '2025-03-01T00:00:00.000Z', 'DELETED')], nextCursor: null } });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error).toBeUndefined();
    calls(fetchPageMock).toStrictEqual([
      { request: { updatedAt: epoch } },
      { request: { cursor: 'cursor-1' } },
      { request: { cursor: 'cursor-2' } },
    ]);

    calls(repairItemsMock).toMatchObject([
      { items: [{ uuid: 'a' }], checkpoint },
      { items: [{ uuid: 'b' }], checkpoint },
      { items: [{ uuid: 'c' }], checkpoint },
    ]);

    calls(commitScanPageMock).toStrictEqual([
      {
        rootUuid: 'rootUuid',
        itemType: 'file',
        items: [{ uuid: 'a', remoteStatus: 'EXISTS' }],
        updatedAt: '2025-01-01T00:00:00.000Z',
        completed: false,
      },
      {
        rootUuid: 'rootUuid',
        itemType: 'file',
        items: [{ uuid: 'b', remoteStatus: 'TRASHED' }],
        updatedAt: '2025-02-01T00:00:00.000Z',
        completed: false,
      },
      {
        rootUuid: 'rootUuid',
        itemType: 'file',
        items: [{ uuid: 'c', remoteStatus: 'DELETED' }],
        updatedAt: '2025-03-01T00:00:00.000Z',
        completed: true,
      },
    ]);
  });

  it('should pace requests between pages but not after the last page', async () => {
    // Given
    fetchPageMock
      .mockResolvedValueOnce({ data: { items: [item('a', '2025-01-01T00:00:00.000Z')], nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({ data: { items: [item('b', '2025-02-01T00:00:00.000Z')], nextCursor: null } });
    // When
    await scanRecoverySyncItems(props);
    // Then
    calls(sleepMock).toStrictEqual([30_000]);
  });

  it('should complete an empty scan with the saved progress', async () => {
    // When
    await scanRecoverySyncItems(props);
    // Then
    calls(commitScanPageMock).toMatchObject([{ items: [], updatedAt: epoch, completed: true }]);
    calls(sleepMock).toHaveLength(0);
  });

  it('should keep the saved progress for an empty page with a next cursor', async () => {
    // Given
    fetchPageMock
      .mockResolvedValueOnce({ data: { items: [item('a', '2025-01-01T00:00:00.000Z')], nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({ data: { items: [], nextCursor: 'cursor-2' } })
      .mockResolvedValueOnce({ data: { items: [], nextCursor: null } });
    // When
    await scanRecoverySyncItems(props);
    // Then
    calls(commitScanPageMock).toMatchObject([
      { updatedAt: '2025-01-01T00:00:00.000Z', completed: false },
      { updatedAt: '2025-01-01T00:00:00.000Z', completed: false },
      { updatedAt: '2025-01-01T00:00:00.000Z', completed: true },
    ]);
  });

  it('should resume one millisecond before the saved progress to replay items sharing its timestamp', async () => {
    // Given
    startOrResumeScanMock.mockReturnValue({
      data: { rootUuid: 'rootUuid', itemType: 'file', checkpoint, updatedAt: '2025-06-01T00:00:00.000Z', completed: 0 },
    });
    // When
    await scanRecoverySyncItems(props);
    // Then
    calls(fetchPageMock).toStrictEqual([{ request: { updatedAt: '2025-05-31T23:59:59.999Z' } }]);
  });

  it('should not scan again a completed scan', async () => {
    // Given
    startOrResumeScanMock.mockReturnValue({ data: { rootUuid: 'rootUuid', itemType: 'file', checkpoint, updatedAt: epoch, completed: 1 } });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error).toBeUndefined();
    calls(fetchPageMock).toHaveLength(0);
  });

  it('should skip the scan when there is no normal checkpoint', async () => {
    // Given
    startOrResumeScanMock.mockReturnValue({ error: new SingleItemError('NOT_FOUND') });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error).toBeUndefined();
    calls(fetchPageMock).toHaveLength(0);
  });

  it('should fail when the scan cannot be started', async () => {
    // Given
    startOrResumeScanMock.mockReturnValue({ error: new SingleItemError('UNKNOWN') });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
    calls(fetchPageMock).toHaveLength(0);
  });

  it('should stop without committing when a page cannot be fetched', async () => {
    // Given
    fetchPageMock
      .mockResolvedValueOnce({ data: { items: [item('a', '2025-01-01T00:00:00.000Z')], nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({ error: new DriveServerWipError('SERVER', 'cause') });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error?.message).toBe('SERVER');
    calls(commitScanPageMock).toMatchObject([{ completed: false }]);
  });

  it('should stop without committing when a page cannot be repaired', async () => {
    // Given
    repairItemsMock.mockResolvedValue({ error: new SqliteError('UNKNOWN') });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
    calls(commitScanPageMock).toHaveLength(0);
  });

  it('should stop when a page cannot be committed', async () => {
    // Given
    fetchPageMock.mockResolvedValue({ data: { items: [item('a', '2025-01-01T00:00:00.000Z')], nextCursor: 'cursor-1' } });
    commitScanPageMock.mockReturnValue({ error: new SqliteError('INVALID_PROGRESS') });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error?.message).toBe('INVALID_PROGRESS');
    calls(fetchPageMock).toHaveLength(1);
    calls(sleepMock).toHaveLength(0);
  });

  it('should stop without committing when aborted during a request', async () => {
    // Given
    fetchPageMock.mockImplementation(() => {
      props.ctx.abortController.abort();
      return Promise.resolve({ data: { items: [item('a', '2025-01-01T00:00:00.000Z')], nextCursor: null } });
    });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error?.name).toBe('AbortError');
    calls(repairItemsMock).toHaveLength(0);
    calls(commitScanPageMock).toHaveLength(0);
  });

  it('should stop without committing when aborted during a repair', async () => {
    // Given
    repairItemsMock.mockImplementation(() => {
      props.ctx.abortController.abort();
      return Promise.resolve({ data: undefined });
    });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error?.name).toBe('AbortError');
    calls(commitScanPageMock).toHaveLength(0);
  });

  it('should stop before the next request when aborted while pacing', async () => {
    // Given
    fetchPageMock.mockResolvedValueOnce({ data: { items: [item('a', '2025-01-01T00:00:00.000Z')], nextCursor: 'cursor-1' } });
    sleepMock.mockImplementation(() => {
      props.ctx.abortController.abort();
      return Promise.resolve();
    });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error?.name).toBe('AbortError');
    calls(fetchPageMock).toHaveLength(1);
    calls(commitScanPageMock).toMatchObject([{ completed: false }]);
  });

  it('should not request anything when already aborted', async () => {
    // Given
    props.ctx.abortController.abort();
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error?.name).toBe('AbortError');
    calls(fetchPageMock).toHaveLength(0);
  });

  it('should restart from the saved progress when the cursor is rejected', async () => {
    // Given
    fetchPageMock
      .mockResolvedValueOnce({ data: { items: [item('a', '2025-01-01T00:00:00.000Z')], nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({ error: invalidCursorError() })
      .mockResolvedValueOnce({
        data: { items: [item('a', '2025-01-01T00:00:00.000Z'), item('b', '2025-02-01T00:00:00.000Z')], nextCursor: null },
      });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error).toBeUndefined();
    calls(fetchPageMock).toStrictEqual([
      { request: { updatedAt: epoch } },
      { request: { cursor: 'cursor-1' } },
      { request: { updatedAt: '2024-12-31T23:59:59.999Z' } },
    ]);
    calls(commitScanPageMock).toMatchObject([{ completed: false }, { updatedAt: '2025-02-01T00:00:00.000Z', completed: true }]);
  });

  it('should fail when the cursor is rejected again without progress', async () => {
    // Given
    fetchPageMock
      .mockResolvedValueOnce({ data: { items: [item('a', '2025-01-01T00:00:00.000Z')], nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({ error: invalidCursorError() })
      .mockResolvedValueOnce({ data: { items: [item('a', '2025-01-01T00:00:00.000Z')], nextCursor: 'cursor-2' } })
      .mockResolvedValueOnce({ error: invalidCursorError() });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error).toBeInstanceOf(DriveServerWipError);
    calls(fetchPageMock).toHaveLength(4);
  });

  it('should not restart when the first request is rejected', async () => {
    // Given
    fetchPageMock.mockResolvedValue({ error: invalidCursorError() });
    // When
    const { error } = await scanRecoverySyncItems(props);
    // Then
    expect(error).toBeInstanceOf(DriveServerWipError);
    calls(fetchPageMock).toHaveLength(1);
  });
});
