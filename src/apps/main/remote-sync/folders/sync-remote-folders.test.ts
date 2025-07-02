import { mockDeep } from 'vitest-mock-extended';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { syncRemoteFolder } from './sync-remote-folder';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { syncRemoteFolders } from './sync-remote-folders';
import { TWorkerConfig } from '../../background-processes/sync-engine/store';
import { LokijsModule } from '@/infra/lokijs/lokijs.module';
import { Config } from '@/apps/sync-engine/config';

vi.mock(import('@/apps/main/util'));
vi.mock(import('./sync-remote-folder'));
vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));
vi.mock(import('@/infra/lokijs/lokijs.module'));

describe('sync-remote-folders.service', () => {
  const syncRemoteFolderMock = deepMocked(syncRemoteFolder);
  const getFoldersMock = deepMocked(driveServerWip.folders.getFolders);
  const updateCheckpointMock = vi.mocked(LokijsModule.CheckpointsModule.updateCheckpoint);

  const config = mockDeep<Config>();
  config.userUuid = 'uuid';
  const worker = mockDeep<TWorkerConfig>();
  const remoteSyncManager = new RemoteSyncManager(config, worker, '');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('If we fetch less than 50 files, then do not fetch again', async () => {
    // Given
    getFoldersMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFolders({ self: remoteSyncManager });

    // Then
    expect(getFoldersMock).toHaveBeenCalledTimes(1);
  });

  it('If from is undefined, fetch only EXISTS files', async () => {
    // Given
    getFoldersMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFolders({ self: remoteSyncManager });

    // Then
    expect(getFoldersMock).toBeCalledWith({
      query: expect.objectContaining({
        status: 'EXISTS',
      }),
    });
  });

  it('If from is provided, fetch ALL files', async () => {
    // Given
    getFoldersMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFolders({ self: remoteSyncManager, from: new Date() });

    // Then
    expect(getFoldersMock).toBeCalledWith({
      query: expect.objectContaining({
        status: 'ALL',
      }),
    });
  });

  it('If we fetch 50 files, then fetch again', async () => {
    // Given
    getFoldersMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFoldersMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFolders({ self: remoteSyncManager });

    // Then
    expect(getFoldersMock).toHaveBeenCalledTimes(2);
    expect(syncRemoteFolderMock).toHaveBeenCalledTimes(50);
  });

  it('If fetch fails, then throw error', async () => {
    // Given
    getFoldersMock.mockResolvedValueOnce({ error: new Error() });

    // When
    await expect(() => syncRemoteFolders({ self: remoteSyncManager })).rejects.toThrowError();

    // Then
    expect(getFoldersMock).toHaveBeenCalledTimes(1);
  });

  it('Update checkpoint after fetch', async () => {
    // Given
    getFoldersMock.mockResolvedValueOnce({ data: Array(50).fill({ updatedAt: '2025-06-28T12:25:07.000Z' }) });
    getFoldersMock.mockResolvedValueOnce({ data: [{ updatedAt: '2025-06-29T12:25:07.000Z' }] });

    // When
    await syncRemoteFolders({ self: remoteSyncManager });

    // Then
    const common = { userUuid: 'uuid', workspaceId: '', type: 'folder' };
    expect(updateCheckpointMock).toHaveBeenCalledTimes(2);
    expect(updateCheckpointMock).toBeCalledWith({ ...common, checkpoint: '2025-06-28T12:25:07.000Z' });
    expect(updateCheckpointMock).toBeCalledWith({ ...common, checkpoint: '2025-06-29T12:25:07.000Z' });
  });
});
