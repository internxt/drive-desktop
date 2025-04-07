import { mockDeep } from 'vitest-mock-extended';
import { SyncRemoteFilesService } from './sync-remote-files.service';
import { FetchFilesService } from './fetch-files.service.interface';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { LoggerService } from '@/apps/shared/logger/logger';
import { getMockCalls } from 'tests/vitest/utils.helper.test';
import { RemoteSyncedFile } from '../helpers';

vi.mock(import('@/apps/main/util'));

describe('sync-remote-files.service', () => {
  const workspaceId = 'workspaceId';

  const remoteSyncManager = mockDeep<RemoteSyncManager>();
  const fetchFiles = mockDeep<FetchFilesService>();
  const logger = mockDeep<LoggerService>();
  const service = new SyncRemoteFilesService(workspaceId, fetchFiles, logger);

  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it('If checkpoint is null, fetch only EXISTS files', async () => {
    // When
    await service.run({ self: remoteSyncManager });

    // Then
    expect(fetchFiles.run).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'EXISTS',
      }),
    );
  });

  it('If checkpoint is provided, fetch ALL files', async () => {
    // When
    await service.run({ self: remoteSyncManager, from: new Date() });

    // Then
    expect(fetchFiles.run).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ALL',
      }),
    );
  });

  it('If fetch always throws an error, retry it 3 times with offset 0', async () => {
    // Given
    fetchFiles.run.mockRejectedValue(new Error());

    // When
    const files = await service.run({ self: remoteSyncManager });

    // Then
    expect(files.length).toBe(0);
    expect(fetchFiles.run).toHaveBeenCalledTimes(3);
    expect(remoteSyncManager.changeStatus).toHaveBeenCalledWith('SYNC_FAILED');
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
    expect(remoteSyncManager.changeStatus).toHaveBeenCalledWith('SYNC_FAILED');
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 50, retry: 1 }),
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 50, retry: 2 }),
      expect.objectContaining({ msg: 'Remote files sync failed', offset: 50, retry: 3 }),
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
    expect(getMockCalls(logger.error)).toStrictEqual([
      expect.objectContaining({
        msg: 'Remote files sync failed',
        offset: 50,
        retry: 1,
      }),
    ]);
  });
});
