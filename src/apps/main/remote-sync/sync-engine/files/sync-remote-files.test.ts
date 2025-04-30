import { mockDeep } from 'vitest-mock-extended';
import { logger, LoggerService } from '@/apps/shared/logger/logger';
import { deepMocked, getMockCalls } from 'tests/vitest/utils.helper.test';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { syncRemoteFile } from './sync-remote-file';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { RemoteSyncManager } from '../../RemoteSyncManager';
import { syncRemoteFiles } from './sync-remote-files';

vi.mock(import('@/apps/main/util'));
vi.mock(import('@/apps/main/auth/service'));
vi.mock(import('./sync-remote-file'));

describe('sync-remote-files.service', () => {
  const workspaceId = 'workspaceId';

  const getUserOrThrowMock = deepMocked(getUserOrThrow);
  const syncRemoteFileMock = deepMocked(syncRemoteFile);
  const getFilesMock = deepMocked(driveServerWip.workspaces.getFilesInWorkspace);
  const loggerMock = vi.mocked(logger);

  const remoteSyncManager = mockDeep<RemoteSyncManager>();

  beforeEach(() => {
    vi.clearAllMocks();
    getUserOrThrowMock.mockResolvedValue({ uuid: 'uuid' });
  });

  it('If there are less files than the limit, do not fetch again', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFiles({ workspaceId, browserWindow: null, from: null });

    // Then
    expect(getFilesMock).toHaveBeenCalledTimes(1);
    expect(syncRemoteFileMock).toHaveBeenCalledTimes(0);
  });

  it('If checkpoint is null, fetch only EXISTS files', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFiles({ workspaceId, browserWindow: null, from: null });

    // Then
    expect(getFilesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          status: 'EXISTS',
        }),
      }),
    );
  });

  it('If checkpoint is provided, fetch ALL files', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ data: [] });

    // When
    await syncRemoteFiles({ workspaceId, browserWindow: null, from: new Date() });

    // Then
    expect(getFilesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          status: 'ALL',
        }),
      }),
    );
  });

  it.only('If fetch always throws an error, retry it 3 times with offset 0', async () => {
    // Given
    getFilesMock.mockRejectedValue(new Error());

    // When
    const promise = syncRemoteFiles({ workspaceId, browserWindow: null, from: null });

    // Then
    await expect(promise).rejects.toThrowError();
    expect(getFilesMock).toHaveBeenCalledTimes(3);
    expect(getMockCalls(loggerMock.error)).toStrictEqual([
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 0, retry: 1 }),
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 0, retry: 2 }),
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 0, retry: 3 }),
    ]);
  });

  it('If fetch always throws an error, retry it 3 times with offset 0', async () => {
    // Given
    fetchWorkspaceFilesMock.mockRejectedValue(new Error());
    fetchWorkspaceFilesMock.mockResolvedValueOnce({ hasMore: true, result: [] });

    // When
    const files = await service.run({ self: remoteSyncManager });

    // Then
    expect(files.length).toBe(0);
    expect(fetchWorkspaceFilesMock).toHaveBeenCalledTimes(4);
    expect(remoteSyncManager.changeStatus).toHaveBeenCalledWith('SYNC_FAILED');
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 50, retry: 1 }),
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 50, retry: 2 }),
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 50, retry: 3 }),
    ]);
  });

  it('If fails in the middle, keep previous files', async () => {
    // Given
    fetchWorkspaceFilesMock.mockResolvedValueOnce({
      hasMore: true,
      result: [{ uuid: 'file1' }],
    });
    fetchWorkspaceFilesMock.mockRejectedValueOnce(new Error());
    fetchWorkspaceFilesMock.mockResolvedValueOnce({
      hasMore: false,
      result: [{ uuid: 'file2' }],
    });

    // When
    const files = await service.run({ self: remoteSyncManager });

    // Then
    expect(files.length).toBe(2);
    expect(syncRemoteFileMock).toHaveBeenCalledTimes(2);
    expect(fetchWorkspaceFilesMock).toHaveBeenCalledTimes(3);
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({
        msg: 'Remote files sync failed',
        offset: 50,
        retry: 1,
      }),
    ]);
  });
});
