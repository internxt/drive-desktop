import { DatabaseCollectionAdapter } from '../database/adapters/base';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemoteSyncManager } from './RemoteSyncManager';
import { DriveFile } from '../database/entities/DriveFile';
import { DriveFolder } from '../database/entities/DriveFolder';
import { FetchRemoteFoldersService } from './folders/fetch-remote-folders.service';
import { DriveFilesCollection } from '../database/collections/DriveFileCollection';
import { DriveFoldersCollection } from '../database/collections/DriveFolderCollection';
import { mockDeep } from 'vitest-mock-extended';

vi.mock('./files/sync-remote-files.service');
vi.mock('./folders/sync-remote-folders');
vi.mock('./folders/fetch-remote-folders.service');
vi.mock('./folders/fetch-workspace-folders.service');

describe('RemoteSyncManager', () => {
  let dbMock: {
    files: DatabaseCollectionAdapter<DriveFile>;
    folders: DatabaseCollectionAdapter<DriveFolder>;
  };
  let configMock: {
    fetchFilesLimitPerRequest: number;
    fetchFoldersLimitPerRequest: number;
  };
  let remoteSyncManager: RemoteSyncManager;

  beforeEach(() => {
    dbMock = {
      files: mockDeep<DriveFilesCollection>(),
      folders: mockDeep<DriveFoldersCollection>(),
    };
    configMock = {
      fetchFilesLimitPerRequest: 10,
      fetchFoldersLimitPerRequest: 10,
    };
    remoteSyncManager = new RemoteSyncManager(dbMock, configMock, 'workspaceId');
  });

  it('should initialize with default values', () => {
    expect(remoteSyncManager.status).toBe('IDLE');
    expect(remoteSyncManager.totalFilesSynced).toBe(0);
    expect(remoteSyncManager.getUnSyncFiles()).toEqual([]);
    expect(remoteSyncManager.totalFoldersSynced).toBe(0);
  });

  it('should change status and call callbacks', () => {
    const callback = vi.fn();
    remoteSyncManager.onStatusChange(callback);
    remoteSyncManager['changeStatus']('SYNCING');
    expect(remoteSyncManager.status).toBe('SYNCING');
    expect(callback).toHaveBeenCalledWith('SYNCING');
  });

  it('should reset remote sync', () => {
    remoteSyncManager.resetRemoteSync();
    expect(remoteSyncManager.status).toBe('IDLE');
    expect(remoteSyncManager.totalFilesSynced).toBe(0);
    expect(remoteSyncManager.getUnSyncFiles()).toEqual([]);
    expect(remoteSyncManager.totalFoldersSynced).toBe(0);
  });

  it('should handle recentlyWasSyncing correctly', () => {
    remoteSyncManager['lastSyncingFinishedTimestamp'] = new Date(Date.now() - 5000);
    expect(remoteSyncManager.recentlyWasSyncing(10000)).toBe(true);
    expect(remoteSyncManager.recentlyWasSyncing(1000)).toBe(false);
  });

  it('should fetch folders by folder from remote', async () => {
    const fetchFoldersSpy = vi.spyOn(FetchRemoteFoldersService.prototype, 'run').mockResolvedValue({ hasMore: false, result: [] });

    const result = await remoteSyncManager.fetchFoldersByFolderFromRemote({
      folderId: 1,
      offset: 0,
      updatedAtCheckpoint: new Date(),
      status: 'ALL',
    });

    expect(fetchFoldersSpy).toHaveBeenCalled();
    expect(result).toEqual({ hasMore: false, result: [] });
  });
});
