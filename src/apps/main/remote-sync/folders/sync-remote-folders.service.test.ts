import { mockDeep } from 'vitest-mock-extended';
import { SyncRemoteFoldersService } from './sync-remote-folders.service';
import { FetchFoldersService } from './fetch-folders.service.interface';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { LoggerService } from '@/apps/shared/logger/logger';
import { deepMocked, getMockCalls } from 'tests/vitest/utils.helper.test';
import { RemoteSyncedFolder } from '../helpers';
import { getUserOrThrow } from '../../auth/service';

vi.mock(import('@/apps/main/util'));
vi.mock(import('../../auth/service'));

describe('sync-remote-folders.service', () => {
  const workspaceId = 'workspaceId';

  const getUserOrThrowMock = deepMocked(getUserOrThrow);

  const remoteSyncManager = mockDeep<RemoteSyncManager>();
  const fetchFolders = mockDeep<FetchFoldersService>();
  const logger = mockDeep<LoggerService>();
  const service = new SyncRemoteFoldersService(workspaceId, fetchFolders, logger);

  beforeEach(() => {
    vi.clearAllMocks();
    getUserOrThrowMock.mockResolvedValue({ uuid: 'uuid' });
    remoteSyncManager.totalFoldersSynced = 0;
  });

  it('If hasMore is false, then do not fetch again', async () => {
    // Given
    fetchFolders.run.mockResolvedValueOnce({ hasMore: false, result: [] });

    // When
    const folders = await service.run({ self: remoteSyncManager });

    // Then
    expect(folders.length).toBe(0);
    expect(fetchFolders.run).toHaveBeenCalledTimes(1);
  });

  it('If checkpoint is null, fetch only EXISTS files', async () => {
    // When
    await service.run({ self: remoteSyncManager });

    // Then
    expect(fetchFolders.run).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'EXISTS',
      }),
    );
  });

  it('If checkpoint is provided, fetch ALL files', async () => {
    // When
    await service.run({ self: remoteSyncManager, from: new Date() });

    // Then
    expect(fetchFolders.run).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ALL',
      }),
    );
  });

  it('If fetch always throws an error, retry it 3 times with offset 0', async () => {
    // Given
    fetchFolders.run.mockRejectedValue(new Error());

    // When
    const folders = await service.run({ self: remoteSyncManager });

    // Then
    expect(folders.length).toBe(0);
    expect(fetchFolders.run).toHaveBeenCalledTimes(3);
    expect(remoteSyncManager.changeStatus).toHaveBeenCalledWith('SYNC_FAILED');
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 0, retry: 1 }),
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 0, retry: 2 }),
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 0, retry: 3 }),
    ]);
  });

  it('If fetch always throws an error, retry it 3 times with offset 0', async () => {
    // Given
    fetchFolders.run.mockRejectedValue(new Error());
    fetchFolders.run.mockResolvedValueOnce({ hasMore: true, result: [] });

    // When
    const folders = await service.run({ self: remoteSyncManager });

    // Then
    expect(folders.length).toBe(0);
    expect(fetchFolders.run).toHaveBeenCalledTimes(4);
    expect(remoteSyncManager.changeStatus).toHaveBeenCalledWith('SYNC_FAILED');
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 50, retry: 1 }),
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 50, retry: 2 }),
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 50, retry: 3 }),
    ]);
  });

  it('If fails in the middle, keep previous folders', async () => {
    // Given
    fetchFolders.run.mockResolvedValueOnce({
      hasMore: true,
      result: [{ uuid: 'folder1' } as unknown as RemoteSyncedFolder],
    });
    fetchFolders.run.mockRejectedValueOnce(new Error());
    fetchFolders.run.mockResolvedValueOnce({
      hasMore: false,
      result: [{ uuid: 'folder2' } as unknown as RemoteSyncedFolder],
    });

    // When
    const folders = await service.run({ self: remoteSyncManager });

    // Then
    expect(folders.length).toBe(2);
    expect(remoteSyncManager.totalFoldersSynced).toBe(2);
    expect(fetchFolders.run).toHaveBeenCalledTimes(3);
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({
        msg: 'Remote folders sync failed',
        offset: 50,
        retry: 1,
      }),
    ]);
  });
});
