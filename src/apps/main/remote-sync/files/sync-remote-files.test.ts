import { call, calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as createOrUpdateFilesModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { syncRemoteFiles } from './sync-remote-files';

describe('sync-remote-files', () => {
  const createOrUpdateFilesMock = partialSpyOn(createOrUpdateFilesModule, 'createOrUpdateFiles');
  const createOrUpdateCheckpointMock = partialSpyOn(SqliteModule.CheckpointModule, 'createOrUpdate');
  const getFilesSyncPageMock = partialSpyOn(driveServerWip.workspaces, 'getFilesSyncPage');

  const { ctx } = mockProps<typeof syncRemoteFiles>({ ctx: { workspaceId: 'workspace-id' } });

  beforeEach(() => {
    getFilesSyncPageMock.mockResolvedValue({ data: { items: [], nextCursor: null } });
    createOrUpdateFilesMock.mockResolvedValue(undefined);
  });

  it('should stop when the response has no next cursor', async () => {
    // Given
    getFilesSyncPageMock.mockResolvedValue({ data: { items: [], nextCursor: null } });
    // When
    await syncRemoteFiles({ ctx });
    // Then
    calls(getFilesSyncPageMock).toHaveLength(1);
  });

  it('should use the epoch checkpoint when from is not provided', async () => {
    // When
    await syncRemoteFiles({ ctx, from: undefined });
    // Then
    call(getFilesSyncPageMock).toMatchObject({ context: { query: { updatedAt: '1970-01-01T00:00:00.000Z', limit: 1000 } } });
  });

  it('should use from as the initial checkpoint', async () => {
    // When
    const from = new Date('2025-06-28T12:25:07.000Z');
    await syncRemoteFiles({ ctx, from });
    // Then
    call(getFilesSyncPageMock).toMatchObject({ context: { query: { updatedAt: from.toISOString(), limit: 1000 } } });
  });

  it('should fetch the next page using its cursor', async () => {
    // Given
    getFilesSyncPageMock
      .mockResolvedValueOnce({ data: { items: [{ updatedAt: '2025-06-28T12:25:07.000Z' }], nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({ data: { items: [], nextCursor: null } });
    // When
    await syncRemoteFiles({ ctx });
    // Then
    calls(getFilesSyncPageMock).toHaveLength(2);
    calls(getFilesSyncPageMock).toMatchObject([
      { context: { query: { updatedAt: '1970-01-01T00:00:00.000Z', limit: 1000 } } },
      { context: { query: { cursor: 'cursor-1', limit: 1000 } } },
    ]);
    calls(createOrUpdateFilesMock).toHaveLength(2);
  });

  it('should stop execution if fetch fails', async () => {
    // Given
    getFilesSyncPageMock.mockResolvedValue({ error: new Error() });
    // When
    await syncRemoteFiles({ ctx });
    // Then
    calls(getFilesSyncPageMock).toHaveLength(1);
    calls(createOrUpdateFilesMock).toHaveLength(0);
  });

  it('should not update checkpoint if save to database fails', async () => {
    // Given
    createOrUpdateFilesMock.mockResolvedValue(new Error());
    // When
    await syncRemoteFiles({ ctx });
    // Then
    calls(createOrUpdateFilesMock).toHaveLength(1);
    calls(createOrUpdateCheckpointMock).toHaveLength(0);
  });

  it('update checkpoint after save to database', async () => {
    // Given
    getFilesSyncPageMock
      .mockResolvedValueOnce({ data: { items: [{ updatedAt: '2025-06-28T12:25:07.000Z' }], nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({ data: { items: [{ updatedAt: '2025-06-29T12:25:07.000Z' }], nextCursor: null } });
    // When
    await syncRemoteFiles({ ctx });
    // Then
    calls(createOrUpdateCheckpointMock).toMatchObject([
      { updatedAt: '2025-06-28T12:25:07.000Z' },
      { updatedAt: '2025-06-29T12:25:07.000Z' },
    ]);
  });
});
