import { mockDeep } from 'vitest-mock-extended';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { getUserOrThrow } from '../../auth/service';
import { syncRemoteFolder } from './sync-remote-folder';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { syncRemoteFolders } from './sync-remote-folders';
import { TWorkerConfig } from '../../background-processes/sync-engine/store';

vi.mock(import('@/apps/main/util'));
vi.mock(import('../../auth/service'));
vi.mock(import('./sync-remote-folder'));

describe('sync-remote-folders.service', () => {
  const getUserOrThrowMock = deepMocked(getUserOrThrow);
  const syncRemoteFolderMock = deepMocked(syncRemoteFolder);
  const getFoldersMock = deepMocked(driveServerWip.folders.getFolders);

  const worker = mockDeep<TWorkerConfig>();
  const remoteSyncManager = new RemoteSyncManager(worker, '');

  beforeEach(() => {
    vi.clearAllMocks();
    getUserOrThrowMock.mockReturnValue({ uuid: 'uuid' });
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
    expect(getFoldersMock).toHaveBeenCalledWith({
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
    expect(getFoldersMock).toHaveBeenCalledWith({
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
});
