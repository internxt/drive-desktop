import * as paths from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as filesModule from './preserve-files';
import * as foldersModule from './preserve-folders';
import { preserveRecoverySyncItems } from './preserve-recovery-sync-items';
import * as resumeModule from './resume-unfinished-moves';

describe('preserve-recovery-sync-items', () => {
  const resumeMock = partialSpyOn(resumeModule, 'resumeUnfinishedMoves');
  const loadPathsMock = partialSpyOn(paths, 'loadInMemoryPaths');
  const preserveFoldersMock = partialSpyOn(foldersModule, 'preserveFolders');
  const preserveFilesMock = partialSpyOn(filesModule, 'preserveFiles');

  const explorer = { files: new Map(), folders: new Map() };
  let props: Parameters<typeof preserveRecoverySyncItems>[0];

  beforeEach(() => {
    resumeMock.mockResolvedValue({ data: [abs('C:/Drive/resumed.txt')] });
    loadPathsMock.mockResolvedValue(explorer);
    preserveFoldersMock.mockResolvedValue({ data: { moved: [abs('C:/Drive/Docs')], failed: [abs('C:/Drive/Old')] } });
    preserveFilesMock.mockResolvedValue({ data: [abs('C:/Drive/a.txt')] });

    props = mockProps<typeof preserveRecoverySyncItems>({
      ctx: { workspaceId: 'workspaceId' },
      startedAt: '2026-01-02T09:05:07.000Z',
      subfolder: 'Personal Drive',
      rootPaths: [abs('C:/Drive')],
    });
  });

  it('should resume moves, then preserve folders and then files', async () => {
    // When
    const { data } = await preserveRecoverySyncItems(props);
    // Then
    expect(data).toStrictEqual(['C:/Drive/resumed.txt', 'C:/Drive/Old', 'C:/Drive/a.txt']);
    call(preserveFoldersMock).toMatchObject({
      run: { startedAt: '2026-01-02T09:05:07.000Z', subfolder: 'Personal Drive', rootPaths: ['C:/Drive'] },
      folders: explorer.folders,
    });
    call(preserveFilesMock).toMatchObject({ files: explorer.files, movedFolders: ['C:/Drive/Docs'] });
    expect(preserveFoldersMock.mock.calls[0][0].run).toBe(preserveFilesMock.mock.calls[0][0].run);
  });

  it('should not list new items when interrupted moves cannot be resumed', async () => {
    // Given
    resumeMock.mockResolvedValue({ error: new Error('UNKNOWN') });
    // When
    const { error } = await preserveRecoverySyncItems(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
    calls(loadPathsMock).toHaveLength(0);
  });

  it('should stop when the local paths cannot be loaded', async () => {
    // Given
    loadPathsMock.mockRejectedValue(new Error('EPERM'));
    // When
    const { error } = await preserveRecoverySyncItems(props);
    // Then
    expect(error?.message).toBe('EPERM');
    calls(preserveFoldersMock).toHaveLength(0);
    call(loggerMock.error).toMatchObject({
      tag: 'RECOVERY-SYNC',
      msg: 'Error loading local paths for recovery sync',
      workspaceId: 'workspaceId',
    });
  });

  it('should not preserve files when folders fail', async () => {
    // Given
    preserveFoldersMock.mockResolvedValue({ error: new Error('UNKNOWN') });
    // When
    const { error } = await preserveRecoverySyncItems(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
    calls(preserveFilesMock).toHaveLength(0);
  });

  it('should return the error of the files step', async () => {
    // Given
    preserveFilesMock.mockResolvedValue({ error: new Error('UNKNOWN') });
    // When
    const { error } = await preserveRecoverySyncItems(props);
    // Then
    expect(error?.message).toBe('UNKNOWN');
  });
});
