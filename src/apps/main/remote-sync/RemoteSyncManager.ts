import { RemoteSyncStatus, rewind, FIVETEEN_MINUTES_IN_MILLISECONDS } from './helpers';
import { DatabaseCollectionAdapter } from '../database/adapters/base';
import { DriveFolder } from '../database/entities/DriveFolder';
import { DriveFile } from '../database/entities/DriveFile';
import { logger } from '../../shared/logger/logger';
import { SyncRemoteFoldersService } from './folders/sync-remote-folders.service';
import { FetchRemoteFoldersService } from './folders/fetch-remote-folders.service';
import { SyncRemoteFilesService } from './files/sync-remote-files.service';
import { Nullable } from '@/apps/shared/types/Nullable';
import { FetchWorkspaceFoldersService } from './folders/fetch-workspace-folders.service';
import { QueryFolders } from './folders/fetch-folders.service.interface';
import { getEmptyStore } from './store';
import { setTrayStatus } from '../tray/tray';
import { broadcastToWindows } from '../windows';

export class RemoteSyncManager {
  store = getEmptyStore();

  constructor(
    public db: {
      files: DatabaseCollectionAdapter<DriveFile>;
      folders: DatabaseCollectionAdapter<DriveFolder>;
    },
    public workspaceId?: string,
    private readonly syncRemoteFiles = new SyncRemoteFilesService(workspaceId),
    private readonly syncRemoteFolders = new SyncRemoteFoldersService(workspaceId),
    private readonly fetchRemoteFolders = workspaceId ? new FetchWorkspaceFoldersService() : new FetchRemoteFoldersService(),
  ) {}

  set placeholderStatus(status: RemoteSyncStatus) {
    this.store.placeholdersStatus = status;
    this.checkRemoteSyncStatus();
  }

  getSyncStatus(): RemoteSyncStatus {
    return this.store.status;
  }

  getUnSyncFiles(): string[] {
    return this.store.totalFilesUnsynced;
  }

  setUnsyncFiles(files: string[]): void {
    this.store.totalFilesUnsynced = files;
  }

  /**
   * Consult if recently the RemoteSyncManager was syncing
   * @returns True if the RemoteSyncManager was syncing recently
   * @returns False if the RemoteSyncManager was not syncing recently
   * @param milliseconds Time in milliseconds to check if the RemoteSyncManager was syncing
   */
  recentlyWasSyncing(milliseconds: number) {
    const passedTime = Date.now() - (this.store.lastSyncingFinishedTimestamp?.getTime() ?? Date.now());
    return passedTime < milliseconds;
  }

  resetRemoteSync() {
    this.changeStatus('IDLE');
    this.store = getEmptyStore();
  }

  /**
   * Triggers a remote sync so we can populate the localDB, this sync
   * is global and starts pulling all the files the user has in remote.
   *
   * Throws an error if there's a sync in progress for this class instance
   */
  async startRemoteSync(folderId?: number | string) {
    // TODO: change to folderUuid type
    logger.debug({ msg: 'Starting remote to local sync', folderId, workspaceId: this.workspaceId });

    this.store.totalFilesSynced = 0;
    this.store.totalFilesUnsynced = [];
    this.store.totalFoldersSynced = 0;

    try {
      const syncFilesPromise = this.syncRemoteFiles.run({
        self: this,
        folderId,
        from: await this.getFileCheckpoint(),
      });

      const syncFoldersPromise = this.syncRemoteFolders.run({
        self: this,
        folderId,
        from: await this.getLastFolderSyncAt(),
      });

      const [files, folders] = await Promise.all([await syncFilesPromise, await syncFoldersPromise]);
      return { files, folders };
    } catch (error) {
      logger.error({ msg: 'Remote sync failed with error', error });
      this.changeStatus('SYNC_FAILED');
    } finally {
      logger.debug({
        msg: 'Remote sync finished',
        totalFilesSynced: this.store.totalFilesSynced,
        totalFoldersSynced: this.store.totalFoldersSynced,
        totalFilesUnsynced: this.store.totalFilesUnsynced,
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
    this.store.lastSyncingFinishedTimestamp = new Date();

    if (newStatus === this.store.status) return;

    logger.debug({
      msg: 'RemoteSyncManager change status',
      current: this.store.status,
      newStatus,
      lastSyncingFinishedTimestamp: this.store.lastSyncingFinishedTimestamp,
    });

    this.store.status = newStatus;

    broadcastToWindows('remote-sync-status-change', this.store.status);

    switch (newStatus) {
      case 'SYNCING':
        return setTrayStatus('SYNCING');
      case 'SYNC_FAILED':
        return setTrayStatus('ALERT');
      case 'SYNCED':
        return setTrayStatus('IDLE');
    }
  }

  checkRemoteSyncStatus() {
    if (this.store.placeholdersStatus === 'SYNC_PENDING') {
      this.changeStatus('SYNC_PENDING');
      return;
    }

    if (this.store.foldersSyncStatus === 'SYNCED' && this.store.filesSyncStatus === 'SYNCED') {
      this.changeStatus('SYNCED');
      return;
    }

    if (this.store.foldersSyncStatus === 'SYNC_FAILED' || this.store.filesSyncStatus === 'SYNC_FAILED') {
      this.changeStatus('SYNC_FAILED');
      return;
    }
  }

  async getFileCheckpoint(): Promise<Nullable<Date>> {
    const promise = this.workspaceId ? this.db.files.getLastUpdatedByWorkspace(this.workspaceId) : this.db.files.getLastUpdated();

    const { success, result } = await promise;

    if (!success) return undefined;

    if (!result) return undefined;

    const updatedAt = new Date(result.updatedAt);

    return rewind(updatedAt, FIVETEEN_MINUTES_IN_MILLISECONDS);
  }

  private async getLastFolderSyncAt(): Promise<Nullable<Date>> {
    const promise = this.workspaceId ? this.db.folders.getLastUpdatedByWorkspace(this.workspaceId) : this.db.folders.getLastUpdated();

    const { success, result } = await promise;

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
    status: QueryFolders['status'];
  }) {
    return this.fetchRemoteFolders.run({ self: this, offset, folderId, updatedAtCheckpoint, status });
  }
}
