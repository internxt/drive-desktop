import { mockDeep } from 'vitest-mock-extended';
import { SyncRemoteFilesService } from './sync-remote-files.service';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { LoggerService } from '@/apps/shared/logger/logger';
import { deepMocked, getMockCalls } from 'tests/vitest/utils.helper.test';
import { getUserOrThrow } from '../../auth/service';
import { syncRemoteFile } from './sync-remote-file';
import { fetchWorkspaceFiles } from './fetch-workspace-files.service';

vi.mock(import('@/apps/main/util'));
vi.mock(import('../../auth/service'));
vi.mock(import('./sync-remote-file'));
vi.mock(import('./fetch-workspace-files.service'));

describe('sync-remote-files.service', () => {
  const workspaceId = 'workspaceId';

  const getUserOrThrowMock = deepMocked(getUserOrThrow);
  const syncRemoteFileMock = deepMocked(syncRemoteFile);
  const fetchWorkspaceFilesMock = deepMocked(fetchWorkspaceFiles);

  const remoteSyncManager = mockDeep<RemoteSyncManager>();
  const logger = mockDeep<LoggerService>();
  const service = new SyncRemoteFilesService(workspaceId, logger);

  beforeEach(() => {
    vi.clearAllMocks();
    getUserOrThrowMock.mockResolvedValue({ uuid: 'uuid' });
  });

  it('If hasMore is false, then do not fetch again', async () => {
    // Given
    fetchWorkspaceFilesMock.mockResolvedValueOnce({ hasMore: false, result: [] });

    // When
    const files = await service.run({ self: remoteSyncManager });

    // Then
    expect(files.length).toBe(0);
    expect(fetchWorkspaceFilesMock).toHaveBeenCalledTimes(1);
  });

  it('If checkpoint is null, fetch only EXISTS files', async () => {
    // When
    await service.run({ self: remoteSyncManager });

    // Then
    expect(fetchWorkspaceFilesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'EXISTS',
      }),
    );
  });

  it('If checkpoint is provided, fetch ALL files', async () => {
    // When
    await service.run({ self: remoteSyncManager, from: new Date() });

    // Then
    expect(fetchWorkspaceFilesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ALL',
      }),
    );
  });

  it('If fetch always throws an error, retry it 3 times with offset 0', async () => {
    // Given
    fetchWorkspaceFilesMock.mockRejectedValue(new Error());

    // When
    const files = await service.run({ self: remoteSyncManager });

    // Then
    expect(files.length).toBe(0);
    expect(fetchWorkspaceFilesMock).toHaveBeenCalledTimes(3);
    expect(remoteSyncManager.changeStatus).toHaveBeenCalledWith('SYNC_FAILED');
    expect(getMockCalls(logger.error)).toStrictEqual([
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
