import { mockDeep } from 'vitest-mock-extended';
import { SyncRemoteFoldersService } from './sync-remote-folders.service';
import { FetchFoldersService } from './fetch-folders.service.interface';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { LoggerService } from '@/apps/shared/logger/logger';
import { getMockCalls } from 'tests/vitest/utils.helper.test';

describe('sync-remote-folders.service', () => {
  const workspaceId = 'workspaceId';

  const remoteSyncManager = mockDeep<RemoteSyncManager>();
  const fetchFiles = mockDeep<FetchFoldersService>();
  const logger = mockDeep<LoggerService>();
  const service = new SyncRemoteFoldersService(workspaceId, fetchFiles, logger);

  beforeEach(() => {
    vi.clearAllMocks();
    remoteSyncManager.foldersSyncStatus = 'IDLE';
    remoteSyncManager.config.fetchFoldersLimitPerRequest = 10;
  });

  it('If no hasMore is false, then do not fetch again', async () => {
    // Given
    fetchFiles.run.mockResolvedValueOnce({ hasMore: false, result: [] });

    // When
    const folders = await service.run({ self: remoteSyncManager });

    // Then
    expect(folders.length).toBe(0);
    expect(fetchFiles.run).toHaveBeenCalledTimes(1);
    // TODO: maybe we need to set it to SYNCED?
    expect(remoteSyncManager.foldersSyncStatus).toBe('IDLE');
  });

  it('If fetch always throws an error, retry it 3 times with offset 0', async () => {
    // Given
    fetchFiles.run.mockRejectedValue(new Error());

    // When
    const folders = await service.run({ self: remoteSyncManager });

    // Then
    expect(folders.length).toBe(0);
    expect(fetchFiles.run).toHaveBeenCalledTimes(3);
    expect(remoteSyncManager.foldersSyncStatus).toBe('SYNC_FAILED');
    expect(remoteSyncManager.checkRemoteSyncStatus).toHaveBeenCalledTimes(1);
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 0, retry: 1 }),
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 0, retry: 2 }),
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 0, retry: 3 }),
    ]);
  });

  it('If fetch always throws an error, retry it 3 times with offset 0', async () => {
    // Given
    fetchFiles.run.mockRejectedValue(new Error());
    fetchFiles.run.mockResolvedValueOnce({ hasMore: true, result: [] });

    // When
    const folders = await service.run({ self: remoteSyncManager });

    // Then
    expect(folders.length).toBe(0);
    expect(fetchFiles.run).toHaveBeenCalledTimes(4);
    expect(remoteSyncManager.foldersSyncStatus).toBe('SYNC_FAILED');
    expect(remoteSyncManager.checkRemoteSyncStatus).toHaveBeenCalledTimes(1);
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 10, retry: 1 }),
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 10, retry: 2 }),
      expect.objectContaining({ msg: 'Remote folders sync failed', offset: 10, retry: 3 }),
    ]);
  });
});
