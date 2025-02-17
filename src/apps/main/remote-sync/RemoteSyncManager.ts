import { RemoteSyncStatus, rewind, WAITING_AFTER_SYNCING_DEFAULT, FIVETEEN_MINUTES_IN_MILLISECONDS } from './helpers';
import { reportError } from '../bug-report/service';

import { DatabaseCollectionAdapter } from '../database/adapters/base';
import { Axios } from 'axios';
import { DriveFolder } from '../database/entities/DriveFolder';
import { DriveFile } from '../database/entities/DriveFile';
import { logger } from '../../shared/logger/logger';
import { SyncRemoteFoldersService } from './folders/sync-remote-folders';
import { FetchRemoteFoldersService } from './folders/fetch-remote-folders.service';
import { SyncRemoteFilesService } from './files/sync-remote-files.service';
import { Nullable } from '@/apps/shared/types/Nullable';

export class RemoteSyncManager {
  foldersSyncStatus: RemoteSyncStatus = 'IDLE';
  filesSyncStatus: RemoteSyncStatus = 'IDLE';
  private _placeholdersStatus: RemoteSyncStatus = 'IDLE';
  status: RemoteSyncStatus = 'IDLE';
  private onStatusChangeCallbacks: Array<(newStatus: RemoteSyncStatus) => void> = [];
  totalFilesSynced = 0;
  private totalFilesUnsynced: string[] = [];
  totalFoldersSynced = 0;
  private lastSyncingFinishedTimestamp: Date | null = null;

  constructor(
    public db: {
      files: DatabaseCollectionAdapter<DriveFile>;
      folders: DatabaseCollectionAdapter<DriveFolder>;
    },
    public config: {
      httpClient: Axios;
      fetchFilesLimitPerRequest: number;
      fetchFoldersLimitPerRequest: number;
    },

    public workspaceId?: string,
    private readonly syncRemoteFiles = new SyncRemoteFilesService(this.workspaceId),
    private readonly syncRemoteFolders = new SyncRemoteFoldersService(this.workspaceId),
    private readonly fetchRemoteFolders = this.workspaceId ? new FetchRemoteFoldersService() : new FetchRemoteFoldersService(),
  ) {}

  set placeholderStatus(status: RemoteSyncStatus) {
    this._placeholdersStatus = status;
    this.checkRemoteSyncStatus();
  }

  onStatusChange(callback: (newStatus: RemoteSyncStatus) => void) {
    if (typeof callback !== 'function') return;
    this.onStatusChangeCallbacks.push(callback);
  }

  getSyncStatus(): RemoteSyncStatus {
    return this.status;
  }

  getUnSyncFiles(): string[] {
    return this.totalFilesUnsynced;
  }

  setUnsyncFiles(files: string[]): void {
    this.totalFilesUnsynced = files;
  }

  /**
   * Consult if recently the RemoteSyncManager was syncing
   * @returns True if the RemoteSyncManager was syncing recently
   * @returns False if the RemoteSyncManager was not syncing recently
   * @param milliseconds Time in milliseconds to check if the RemoteSyncManager was syncing
   */
  recentlyWasSyncing(milliseconds: number) {
    const passedTime = Date.now() - (this.lastSyncingFinishedTimestamp?.getTime() ?? Date.now());
    return passedTime < (milliseconds ?? WAITING_AFTER_SYNCING_DEFAULT);
  }

  resetRemoteSync() {
    this.changeStatus('IDLE');
    this.filesSyncStatus = 'IDLE';
    this.foldersSyncStatus = 'IDLE';
    this._placeholdersStatus = 'IDLE';
    this.lastSyncingFinishedTimestamp = null;
    this.totalFilesSynced = 0;
    this.totalFilesUnsynced = [];
    this.totalFoldersSynced = 0;
  }
  /**
   * Triggers a remote sync so we can populate the localDB, this sync
   * is global and starts pulling all the files the user has in remote.
   *
   * Throws an error if there's a sync in progress for this class instance
   */
  async startRemoteSync(folderId?: number | string) {
    logger.info({ msg: 'Starting remote to local sync', folderId });

    this.totalFilesSynced = 0;
    this.totalFilesUnsynced = [];
    this.totalFoldersSynced = 0;
    await this.db.files.connect();
    await this.db.folders.connect();

    try {
      const syncFilesPromise = this.syncRemoteFiles.run({
        self: this,
        retry: 1,
        folderId,
        from: await this.getFileCheckpoint(),
      });

      const syncFoldersPromise = this.syncRemoteFolders.run({
        self: this,
        retry: 1,
        folderId,
        from: await this.getLastFolderSyncAt(),
      });

      const [files, folders] = await Promise.all([await syncFilesPromise, await syncFoldersPromise]);
      return { files, folders };
    } catch (error) {
      this.changeStatus('SYNC_FAILED');
      reportError(error as Error);
    } finally {
      logger.info({
        totalFilesSynced: this.totalFilesSynced,
        totalFoldersSynced: this.totalFoldersSynced,
        totalFilesUnsynced: this.totalFilesUnsynced,
      });
    }
    return {
      files: [],
      folders: [],
    };
  }

  set isProcessRunning(value: boolean) {
    this.changeStatus(value ? 'SYNCING' : 'SYNCED');
  }

  private changeStatus(newStatus: RemoteSyncStatus) {
    this.lastSyncingFinishedTimestamp = new Date();

    if (newStatus === this.status) return;

    logger.info({
      msg: 'RemoteSyncManager change status',
      current: this.status,
      newStatus,
      lastSyncingFinishedTimestamp: this.lastSyncingFinishedTimestamp,
    });

    this.status = newStatus;
    this.onStatusChangeCallbacks.forEach((callback) => {
      if (typeof callback !== 'function') return;
      callback(newStatus);
    });
  }

  checkRemoteSyncStatus() {
    if (this._placeholdersStatus === 'SYNC_PENDING') {
      this.changeStatus('SYNC_PENDING');
      return;
    }

    if (this.foldersSyncStatus === 'SYNCED' && this.filesSyncStatus === 'SYNCED') {
      this.changeStatus('SYNCED');
      return;
    }

    if (this.foldersSyncStatus === 'SYNC_FAILED' || this.filesSyncStatus === 'SYNC_FAILED') {
      this.changeStatus('SYNC_FAILED');
      return;
    }
  }

  async getFileCheckpoint(): Promise<Nullable<Date>> {
    const { success, result } = await this.db.files.getLastUpdated();

    if (!success) return undefined;

    if (!result) return undefined;

    const updatedAt = new Date(result.updatedAt);

    return rewind(updatedAt, FIVETEEN_MINUTES_IN_MILLISECONDS);
  }

  private async getLastFolderSyncAt(): Promise<Nullable<Date>> {
    const { success, result } = await this.db.folders.getLastUpdated();

    if (!success) return undefined;

    if (!result) return undefined;

    const updatedAt = new Date(result.updatedAt);

    return rewind(updatedAt, FIVETEEN_MINUTES_IN_MILLISECONDS);
  }

  async fetchFoldersByFolderFromRemote({
    folderId,
    offset,
    updatedAtCheckpoint,
    status,
  }: {
    folderId: number;
    offset: number;
    updatedAtCheckpoint: Date;
    status: string;
  }) {
    return this.fetchRemoteFolders.run({ self: this, offset, folderId, updatedAtCheckpoint, status });
  }
}
