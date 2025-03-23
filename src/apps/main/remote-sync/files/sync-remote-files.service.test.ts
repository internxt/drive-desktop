import { mockDeep } from 'vitest-mock-extended';
import { SyncRemoteFilesService } from './sync-remote-files.service';
import { FetchFilesService } from './fetch-files.service.interface';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { LoggerService } from '@/apps/shared/logger/logger';
import { getMockCalls } from 'tests/vitest/utils.helper.test';
import { RemoteSyncedFile } from '../helpers';

describe('sync-remote-files.service', () => {
  const workspaceId = 'workspaceId';

  const remoteSyncManager = mockDeep<RemoteSyncManager>();
  const fetchFiles = mockDeep<FetchFilesService>();
  const logger = mockDeep<LoggerService>();
  const service = new SyncRemoteFilesService(workspaceId, fetchFiles, logger);

  beforeEach(() => {
    vi.clearAllMocks();
    remoteSyncManager.filesSyncStatus = 'IDLE';
    remoteSyncManager.config.fetchFilesLimitPerRequest = 10;
    remoteSyncManager.totalFilesSynced = 0;
  });

  it('If hasMore is false, then do not fetch again', async () => {
    // Given
    fetchFiles.run.mockResolvedValueOnce({ hasMore: false, result: [] });

    // When
    const files = await service.run({ self: remoteSyncManager });

    // Then
    expect(files.length).toBe(0);
    expect(fetchFiles.run).toHaveBeenCalledTimes(1);
    // TODO: maybe we need to set it to SYNCED?
    expect(remoteSyncManager.filesSyncStatus).toBe('IDLE');
  });

  it('If fetch always throws an error, retry it 3 times with offset 0', async () => {
    // Given
    fetchFiles.run.mockRejectedValue(new Error());

    // When
    const files = await service.run({ self: remoteSyncManager });

    // Then
    expect(files.length).toBe(0);
    expect(fetchFiles.run).toHaveBeenCalledTimes(3);
    expect(remoteSyncManager.filesSyncStatus).toBe('SYNC_FAILED');
    expect(remoteSyncManager.checkRemoteSyncStatus).toHaveBeenCalledTimes(1);
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 0, retry: 1 }),
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 0, retry: 2 }),
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 0, retry: 3 }),
    ]);
  });

  it('If fetch always throws an error, retry it 3 times with offset 0', async () => {
    // Given
    fetchFiles.run.mockRejectedValue(new Error());
    fetchFiles.run.mockResolvedValueOnce({ hasMore: true, result: [] });

    // When
    const files = await service.run({ self: remoteSyncManager });

    // Then
    expect(files.length).toBe(0);
    expect(fetchFiles.run).toHaveBeenCalledTimes(4);
    expect(remoteSyncManager.filesSyncStatus).toBe('SYNC_FAILED');
    expect(remoteSyncManager.checkRemoteSyncStatus).toHaveBeenCalledTimes(1);
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 10, retry: 1 }),
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 10, retry: 2 }),
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 10, retry: 3 }),
    ]);
  });

  it('If fails in the middle, keep previous files', async () => {
    // Given
    fetchFiles.run.mockResolvedValueOnce({
      hasMore: true,
      result: [{ uuid: 'file1' } as unknown as RemoteSyncedFile],
    });
    fetchFiles.run.mockRejectedValueOnce(new Error());
    fetchFiles.run.mockResolvedValueOnce({
      hasMore: false,
      result: [{ uuid: 'file2' } as unknown as RemoteSyncedFile],
    });

    // When
    const files = await service.run({ self: remoteSyncManager });

    // Then
    expect(files.length).toBe(2);
    expect(remoteSyncManager.totalFilesSynced).toBe(2);
    expect(fetchFiles.run).toHaveBeenCalledTimes(3);
    expect(remoteSyncManager.filesSyncStatus).toBe('IDLE');
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({
        msg: 'Remote files sync failed',
        offset: 10,
        retry: 1,
      }),
    ]);
  });
});
