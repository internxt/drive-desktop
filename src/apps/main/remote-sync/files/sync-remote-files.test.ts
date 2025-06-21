import { mockDeep } from 'vitest-mock-extended';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { getUserOrThrow } from '../../auth/service';
import { syncRemoteFile } from './sync-remote-file';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { syncRemoteFiles } from './sync-remote-files';
import { TWorkerConfig } from '../../background-processes/sync-engine/store';

vi.mock(import('@/apps/main/util'));
vi.mock(import('../../auth/service'));
vi.mock(import('./sync-remote-file'));

describe('sync-remote-files.service', () => {
  const getUserOrThrowMock = deepMocked(getUserOrThrow);
  const syncRemoteFileMock = deepMocked(syncRemoteFile);
  const getFilesMock = deepMocked(driveServerWip.files.getFiles);

  const worker = mockDeep<TWorkerConfig>();
  const remoteSyncManager = new RemoteSyncManager(worker, '');

  beforeEach(() => {
    vi.clearAllMocks();
    getUserOrThrowMock.mockReturnValue({ uuid: 'uuid' });
  });

  it('If we fetch less than 50 files, then do not fetch again', async () => {
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

  it('If we fetch 50 files, then fetch again', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ data: Array(50).fill({ status: 'EXISTS' }) });
    getFilesMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFiles({ self: remoteSyncManager });

    // Then
    expect(getFilesMock).toHaveBeenCalledTimes(2);
    expect(syncRemoteFileMock).toHaveBeenCalledTimes(50);
  });

  it('If fetch fails, then throw error', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ error: new Error() });

    // When
    await expect(() => syncRemoteFiles({ self: remoteSyncManager })).rejects.toThrowError();

    // Then
    expect(getFilesMock).toHaveBeenCalledTimes(1);
  });
});
