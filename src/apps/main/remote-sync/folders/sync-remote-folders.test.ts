import { mockDeep } from 'vitest-mock-extended';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { deepMocked, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { syncRemoteFolders } from './sync-remote-folders';
import { Config } from '@/apps/sync-engine/config';
import * as createOrUpdateFoldersModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

vi.mock(import('@/apps/main/util'));
vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('sync-remote-folders.service', () => {
  const createOrUpdateFoldersMock = partialSpyOn(createOrUpdateFoldersModule, 'createOrUpdateFolders');
  const createOrUpdateCheckpointMock = partialSpyOn(SqliteModule.CheckpointModule, 'createOrUpdate');
  const getFoldersMock = deepMocked(driveServerWip.folders.getFolders);

  const config = mockDeep<Config>();
  config.userUuid = 'uuid';
  const remoteSyncManager = new RemoteSyncManager(config, '');

  it('If we fetch less than 1000 files, then do not fetch again', async () => {
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

  it('If we fetch 1000 files, then fetch again', async () => {
    // Given
    getFoldersMock.mockResolvedValueOnce({ data: Array(1000).fill({ status: 'EXISTS' }) });
    getFoldersMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFolders({ self: remoteSyncManager });

    // Then
    expect(getFoldersMock).toHaveBeenCalledTimes(2);
    expect(createOrUpdateFoldersMock).toHaveBeenCalledTimes(2);
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
    getFoldersMock.mockResolvedValueOnce({ data: Array(1000).fill({ updatedAt: '2025-06-28T12:25:07.000Z' }) });
    getFoldersMock.mockResolvedValueOnce({ data: [{ updatedAt: '2025-06-29T12:25:07.000Z' }] });

    // When
    await syncRemoteFolders({ self: remoteSyncManager });

    // Then
    const common = { userUuid: 'uuid', workspaceId: '', type: 'folder' };
    expect(createOrUpdateCheckpointMock).toHaveBeenCalledTimes(2);
    expect(createOrUpdateCheckpointMock).toBeCalledWith({ ...common, updatedAt: '2025-06-28T12:25:07.000Z' });
    expect(createOrUpdateCheckpointMock).toBeCalledWith({ ...common, updatedAt: '2025-06-29T12:25:07.000Z' });
  });
});
