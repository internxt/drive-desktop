import Logger from 'electron-log';
import * as helpers from './helpers';
import {
  RemoteSyncStatus,
  RemoteSyncedFolder,
  RemoteSyncedFile,
  SyncConfig,
  SYNC_OFFSET_MS,
  WAITING_AFTER_SYNCING
} from './helpers';
import { reportError } from '../bug-report/service';

import { DatabaseCollectionAdapter } from '../database/adapters/base';
import { Axios } from 'axios';
import { DriveFolder } from '../database/entities/DriveFolder';
import { DriveFile } from '../database/entities/DriveFile';

export class RemoteSyncManager {
  private foldersSyncStatus: RemoteSyncStatus = 'IDLE';
  private filesSyncStatus: RemoteSyncStatus = 'IDLE';
  private _placeholdersStatus: RemoteSyncStatus = 'IDLE';
  private status: RemoteSyncStatus = 'IDLE';
  private onStatusChangeCallbacks: Array<
    (newStatus: RemoteSyncStatus) => void
  > = [];
  private totalFilesSynced = 0;
  private totalFoldersSynced = 0;
  private lastSyncingFinishedTimestamp: Date | null = null;

  constructor(
    private db: {
      files: DatabaseCollectionAdapter<DriveFile>;
      folders: DatabaseCollectionAdapter<DriveFolder>;
    },
    private config: {
      httpClient: Axios;
      fetchFilesLimitPerRequest: number;
      fetchFoldersLimitPerRequest: number;
      syncFiles: boolean;
      syncFolders: boolean;
    } // , // private chekers: { //   fileCheker: FileCheckerStatusInRoot; // }
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

  private getLastSyncingFinishedTimestamp() {
    return this.lastSyncingFinishedTimestamp;
  }

  /**
   * Check if the RemoteSyncManager is in SYNCED status
   *
   * @returns True if local database is synced with remote files and folders
   */
  localIsSynced() {
    return this.status === 'SYNCED';
  }

  /**
   * Consult if recently the RemoteSyncManager was syncing
   * @returns True if the RemoteSyncManager was syncing recently
   * @returns False if the RemoteSyncManager was not syncing recently
   */
  recentlyWasSyncing() {
    const passedTime = Date.now() - ( this.getLastSyncingFinishedTimestamp()?.getTime() ?? Date.now() );
    return passedTime < WAITING_AFTER_SYNCING;
  }

  resetRemoteSync() {
    this.changeStatus('IDLE');
    this.filesSyncStatus = 'IDLE';
    this.foldersSyncStatus = 'IDLE';
    this._placeholdersStatus = 'IDLE';
    this.lastSyncingFinishedTimestamp = null;
    this.totalFilesSynced = 0;
    this.totalFoldersSynced = 0;
  }
  /**
   * Triggers a remote sync so we can populate the localDB, this sync
   * is global and starts pulling all the files the user has in remote.
   *
   * Throws an error if there's a sync in progress for this class instance
   */
  async startRemoteSync() {
    // const start = Date.now();
    Logger.info('Starting remote to local sync');
    Logger.info('Checking if we are in a valid state to start the sync');

    const testPassed = this.smokeTest();

    if (!testPassed) {
      return;
    }
    this.totalFilesSynced = 0;
    this.totalFoldersSynced = 0;
    await this.db.files.connect();
    await this.db.folders.connect();

    Logger.info('Starting RemoteSyncManager');
    this.changeStatus('SYNCING');
    try {
      await Promise.all([
        this.config.syncFiles
          ? this.syncRemoteFiles({
              retry: 1,
              maxRetries: 3,
            })
          : Promise.resolve(),
        this.config.syncFolders
          ? this.syncRemoteFolders({
              retry: 1,
              maxRetries: 3,
            })
          : Promise.resolve(),
      ]);
    } catch (error) {
      this.changeStatus('SYNC_FAILED');
      reportError(error as Error);
    } finally {
      // const totalDuration = Date.now() - start;

      // Logger.info('-----------------');
      // Logger.info('REMOTE SYNC STATS\n');
      Logger.info('Total synced files: ', this.totalFilesSynced);
      Logger.info('Total synced folders: ', this.totalFoldersSynced);

      // Logger.info(
      //   `Files sync speed: ${
      //     this.totalFilesSynced / (totalDuration / 1000)
      //   } files/second`
      // );

      // Logger.info('Total synced folders: ', this.totalFoldersSynced);
      // Logger.info(
      //   `Folders sync speed: ${
      //     this.totalFoldersSynced / (totalDuration / 1000)
      //   } folders/second`
      // );
      // Logger.info(`Total remote to local sync time: ${totalDuration}ms`);
      // Logger.info('-----------------');
    }
  }

  /**
   * Run smoke tests before starting the RemoteSyncManager, otherwise fail
   */
  private smokeTest() {
    if (this.status === 'SYNCING') {
      Logger.warn(
        'RemoteSyncManager should not be in SYNCING status to start, not starting again'
      );

      return false;
    }

    return true;
  }
  private changeStatus(newStatus: RemoteSyncStatus) {
    this.addLastSyncingFinishedTimestamp();
    if (newStatus === this.status) return;
    Logger.info(`RemoteSyncManager ${this.status} -> ${newStatus}`);
    this.status = newStatus;
    this.onStatusChangeCallbacks.forEach((callback) => {
      if (typeof callback !== 'function') return;
      callback(newStatus);
    });
  }

  private addLastSyncingFinishedTimestamp() {
    if (this.status !== 'SYNCING') return;
    Logger.info('Adding last syncing finished timestamp');
    this.lastSyncingFinishedTimestamp = new Date();
  }

  private checkRemoteSyncStatus() {
    if (this._placeholdersStatus === 'SYNCING') {
      this.changeStatus('SYNCING');
      return;
    }
    // placeholders are still sync-pending
    if (this._placeholdersStatus === 'SYNC_PENDING') {
      this.changeStatus('SYNC_PENDING');
      return;
    }
    // We only syncing files
    if (
      this.config.syncFiles &&
      !this.config.syncFolders &&
      this.filesSyncStatus === 'SYNCED'
    ) {
      this.changeStatus('SYNCED');
      return;
    }

    // We only syncing folders
    if (
      !this.config.syncFiles &&
      this.config.syncFolders &&
      this.foldersSyncStatus === 'SYNCED'
    ) {
      this.changeStatus('SYNCED');
      return;
    }
    // Files and folders are synced, RemoteSync is Synced
    if (
      this.foldersSyncStatus === 'SYNCED' &&
      this.filesSyncStatus === 'SYNCED'
    ) {
      this.changeStatus('SYNCED');
      return;
    }

    // Files OR Folders sync failed, RemoteSync Failed
    if (
      this.foldersSyncStatus === 'SYNC_FAILED' ||
      this.filesSyncStatus === 'SYNC_FAILED'
    ) {
      this.changeStatus('SYNC_FAILED');
      return;
    }
  }

  /**
   * Syncs all the remote files and saves them into the local db
   * @param syncConfig Config to execute the sync with
   * @returns
   */
  private async syncRemoteFiles(syncConfig: SyncConfig) {
    const lastFilesSyncAt = await helpers.getLastFilesSyncAt();
    try {
      Logger.info(
        `Syncing files updated from ${
          lastFilesSyncAt ?? '(no last date provided)'
        }`
      );
      const { hasMore, result } = await this.fetchFilesFromRemote(
        lastFilesSyncAt
      );

      for (const remoteFile of result) {
        // eslint-disable-next-line no-await-in-loop
        await this.createOrUpdateSyncedFileEntry(remoteFile);
        const fileUpdatedAt = new Date(remoteFile.updatedAt);

        helpers.saveLastFilesSyncAt(fileUpdatedAt, SYNC_OFFSET_MS);
        this.totalFilesSynced++;
      }

      if (!hasMore) {
        Logger.info('Remote files sync finished');
        this.filesSyncStatus = 'SYNCED';
        this.checkRemoteSyncStatus();
        return;
      }
      Logger.info('Retrieving more files for sync');
      await this.syncRemoteFiles({
        retry: 1,
        maxRetries: syncConfig.maxRetries,
      });
    } catch (error) {
      Logger.error('Remote files sync failed with error: ', error);

      reportError(error as Error, {
        lastFilesSyncAt: lastFilesSyncAt
          ? lastFilesSyncAt.toISOString()
          : 'INITIAL_FILES_SYNC',
      });
      if (syncConfig.retry >= syncConfig.maxRetries) {
        // No more retries allowed,
        this.filesSyncStatus = 'SYNC_FAILED';
        this.checkRemoteSyncStatus();
        return;
      }

      await this.syncRemoteFiles({
        retry: syncConfig.retry + 1,
        maxRetries: syncConfig.maxRetries,
      });
    }
  }

  /**
   * Syncs all the remote folders and saves them into the local db
   * @param syncConfig Config to execute the sync with
   * @returns
   */
  private async syncRemoteFolders(syncConfig: SyncConfig) {
    const lastFoldersSyncAt = await helpers.getLastFoldersSyncAt();
    try {
      Logger.info(
        `Syncing folders updated from ${
          lastFoldersSyncAt ?? '(no last date provided)'
        }`
      );
      const { hasMore, result } = await this.fetchFoldersFromRemote(
        lastFoldersSyncAt
      );

      for (const remoteFolder of result) {
        // eslint-disable-next-line no-await-in-loop
        await this.createOrUpdateSyncedFolderEntry(remoteFolder);
        const foldersUpdatedAt = new Date(remoteFolder.updatedAt);

        Logger.info(`Saving folders updatedAt ${foldersUpdatedAt}`);
        helpers.saveLastFoldersSyncAt(foldersUpdatedAt, SYNC_OFFSET_MS);
        this.totalFoldersSynced++;
      }

      if (!hasMore) {
        this.foldersSyncStatus = 'SYNCED';
        this.checkRemoteSyncStatus();
        return;
      }

      Logger.info('Retrieving more folders for sync');
      await this.syncRemoteFolders({
        retry: 1,
        maxRetries: syncConfig.maxRetries,
      });
    } catch (error) {
      Logger.error('Remote folders sync failed with error: ', error);
      reportError(error as Error, {
        lastFoldersSyncAt: lastFoldersSyncAt
          ? lastFoldersSyncAt.toISOString()
          : 'INITIAL_FOLDERS_SYNC',
      });
      if (syncConfig.retry >= syncConfig.maxRetries) {
        // No more retries allowed,
        this.foldersSyncStatus = 'SYNC_FAILED';
        this.checkRemoteSyncStatus();
        return;
      }

      await this.syncRemoteFolders({
        retry: syncConfig.retry + 1,
        maxRetries: syncConfig.maxRetries,
      });
    }
  }

  /**
   * Fetch the files that were updated after the given date
   *
   * @param updatedAtCheckpoint Retrieve files that were updated after this date
   */
  private async fetchFilesFromRemote(updatedAtCheckpoint?: Date): Promise<{
    hasMore: boolean;
    result: RemoteSyncedFile[];
  }> {
    const params = {
      limit: this.config.fetchFilesLimitPerRequest,
      offset: 0,
      status: 'ALL',
      updatedAt: updatedAtCheckpoint
        ? updatedAtCheckpoint.toISOString()
        : undefined,
    };
    const allFilesResponse = await this.fetchItems(params, 'files');
    if (allFilesResponse.status > 299) {
      throw new Error(
        `Fetch files response not ok with body ${JSON.stringify(
          allFilesResponse.data,
          null,
          2
        )} and status ${allFilesResponse.status}`
      );
    }

    if (Array.isArray(allFilesResponse.data)) {
      Logger.info(`Received ${allFilesResponse.data.length} fetched files`);
    } else {
      Logger.info(
        `Expected to receive an array of files, but instead received ${JSON.stringify(
          allFilesResponse,
          null,
          2
        )}`
      );

      throw new Error('Did not receive an array of files');
    }

    const hasMore =
      allFilesResponse.data.length === this.config.fetchFilesLimitPerRequest;

    return {
      hasMore,
      result:
        allFilesResponse.data && Array.isArray(allFilesResponse.data)
          ? allFilesResponse.data.map(this.patchDriveFileResponseItem)
          : [],
    };
  }

  private fetchItems = async (
    params: {
      limit: number;
      offset: number;
      status: string;
      updatedAt: string | undefined;
    },
    type: 'files' | 'folders'
  ) => {
    return await this.config.httpClient.get(
      `${process.env.NEW_DRIVE_URL}/drive/${type}`,
      { params }
    );
  };

  /**
   * Fetch the folders that were updated after the given date
   *
   * @param updatedAtCheckpoint Retrieve folders that were updated after this date
   */
  private async fetchFoldersFromRemote(updatedAtCheckpoint?: Date): Promise<{
    hasMore: boolean;
    result: RemoteSyncedFolder[];
  }> {
    const params = {
      limit: this.config.fetchFilesLimitPerRequest,
      offset: 0,
      status: 'ALL',
      updatedAt: updatedAtCheckpoint
        ? updatedAtCheckpoint.toISOString()
        : undefined,
    };

    const allFoldersResponse = await this.fetchItems(params, 'folders');

    if (allFoldersResponse.status > 299) {
      throw new Error(
        `Fetch files response not ok with body ${JSON.stringify(
          allFoldersResponse.data,
          null,
          2
        )} and status ${allFoldersResponse.status}`
      );
    }

    if (Array.isArray(allFoldersResponse.data)) {
      Logger.info(`Received ${allFoldersResponse.data.length} fetched files`);
    } else {
      Logger.info(
        `Expected to receive an array of files, but instead received ${JSON.stringify(
          allFoldersResponse,
          null,
          2
        )}`
      );

      throw new Error('Did not receive an array of files');
    }

    const hasMore =
      allFoldersResponse.data.length === this.config.fetchFilesLimitPerRequest;

    return {
      hasMore,
      result:
        allFoldersResponse.data && Array.isArray(allFoldersResponse.data)
          ? allFoldersResponse.data.map(this.patchDriveFolderResponseItem)
          : [],
    };
  }

  private patchDriveFolderResponseItem = (payload: any): RemoteSyncedFolder => {
    // We will assume that we received an status
    let status: RemoteSyncedFolder['status'] = payload.status;

    if (!status && !payload.removed) {
      status = 'EXISTS';
    }

    if (!status && payload.removed) {
      status = 'REMOVED';
    }

    if (!status && payload.deleted) {
      status = 'DELETED';
    }

    return {
      ...payload,
      status,
    };
  };

  private patchDriveFileResponseItem = (payload: any): RemoteSyncedFile => {
    return {
      ...payload,
      size:
        typeof payload.size === 'string'
          ? parseInt(payload.size)
          : payload.size,
    };
  };
  private async createOrUpdateSyncedFileEntry(remoteFile: RemoteSyncedFile) {
    if (!remoteFile.folderId) {
      return;
    }
    await this.db.files.create(remoteFile);
  }

  private async createOrUpdateSyncedFolderEntry(
    remoteFolder: RemoteSyncedFolder
  ) {
    if (!remoteFolder.id) {
      return;
    }

    await this.db.folders.create({
      ...remoteFolder,
      parentId: remoteFolder.parentId ?? undefined,
      bucket: remoteFolder.bucket ?? undefined,
    });
  }
}
