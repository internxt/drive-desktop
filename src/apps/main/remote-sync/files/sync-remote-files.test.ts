import { mockDeep } from 'vitest-mock-extended';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { deepMocked, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { syncRemoteFiles } from './sync-remote-files';
import { LokijsModule } from '@/infra/lokijs/lokijs.module';
import { Config } from '@/apps/sync-engine/config';
import * as createOrUpdateFilesModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';

vi.mock(import('@/apps/main/util'));
vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));
vi.mock(import('@/infra/lokijs/lokijs.module'));

describe('sync-remote-files.service', () => {
  const createOrUpdateFilesMock = partialSpyOn(createOrUpdateFilesModule, 'createOrUpdateFiles');
  const getFilesMock = deepMocked(driveServerWip.files.getFiles);
  const updateCheckpointMock = vi.mocked(LokijsModule.CheckpointsModule.updateCheckpoint);

  const config = mockDeep<Config>();
  config.userUuid = 'uuid';
  const remoteSyncManager = new RemoteSyncManager(config, '');

  it('If we fetch less than 1000 files, then do not fetch again', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFiles({ self: remoteSyncManager });

    // Then
    expect(getFilesMock).toHaveBeenCalledTimes(1);
  });

  it('If from is undefined, fetch only EXISTS files', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFiles({ self: remoteSyncManager });

    // Then
    expect(getFilesMock).toHaveBeenCalledWith({
      query: expect.objectContaining({
        status: 'EXISTS',
      }),
    });
  });

  it('If from is provided, fetch ALL files', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFiles({ self: remoteSyncManager, from: new Date() });

    // Then
    expect(getFilesMock).toHaveBeenCalledWith({
      query: expect.objectContaining({
        status: 'ALL',
      }),
    });
  });

  it('If we fetch 1000 files, then fetch again', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ data: Array(1000).fill({ status: 'EXISTS' }) });
    getFilesMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFiles({ self: remoteSyncManager });

    // Then
    expect(getFilesMock).toHaveBeenCalledTimes(2);
    expect(createOrUpdateFilesMock).toHaveBeenCalledTimes(2);
  });

  it('If fetch fails, then throw error', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ error: new Error() });

    // When
    await expect(() => syncRemoteFiles({ self: remoteSyncManager })).rejects.toThrowError();

    // Then
    expect(getFilesMock).toHaveBeenCalledTimes(1);
  });

  it('Update checkpoint after fetch', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ data: Array(1000).fill({ updatedAt: '2025-06-28T12:25:07.000Z' }) });
    getFilesMock.mockResolvedValueOnce({ data: [{ updatedAt: '2025-06-29T12:25:07.000Z' }] });

    // When
    await syncRemoteFiles({ self: remoteSyncManager });

    // Then
    const common = { userUuid: 'uuid', workspaceId: '', type: 'file' };
    expect(updateCheckpointMock).toHaveBeenCalledTimes(2);
    expect(updateCheckpointMock).toBeCalledWith({ ...common, checkpoint: '2025-06-28T12:25:07.000Z' });
    expect(updateCheckpointMock).toBeCalledWith({ ...common, checkpoint: '2025-06-29T12:25:07.000Z' });
  });
});
