import Logger from 'electron-log';
import * as helpers from './helpers';
import {
  RemoteSyncStatus,
  RemoteSyncedFolder,
  RemoteSyncedFile,
  SyncConfig,
  SYNC_OFFSET_MS,
} from './helpers';
import { reportError } from '../bug-report/service';

import { DatabaseCollectionAdapter } from '../database/adapters/base';
import { Axios } from 'axios';
import { DriveFolder } from '../database/entities/DriveFolder';
import { DriveFile } from '../database/entities/DriveFile';

export class RemoteSyncManager {
  private foldersSyncStatus: RemoteSyncStatus = 'IDLE';
  private filesSyncStatus: RemoteSyncStatus = 'IDLE';
  private status: RemoteSyncStatus = 'IDLE';
  private onStatusChangeCallbacks: Array<
    (newStatus: RemoteSyncStatus) => void
  > = [];
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
    }
  ) {}

  onStatusChange(callback: (newStatus: RemoteSyncStatus) => void) {
    if (typeof callback !== 'function') return;
    this.onStatusChangeCallbacks.push(callback);
  }
  getSyncStatus(): RemoteSyncStatus {
    return this.status;
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
   * Triggers a remote sync so we can populate the localDB, this sync
   * is global and starts pulling all the files the user has in remote.
   *
   * Throws an error if there's a sync in progress for this class instance
   */
  async startRemoteSync() {
    const testPassed = this.smokeTest();

    if (!testPassed) {
      return;
    }
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
    if (newStatus === this.status) return;
    Logger.info(`RemoteSyncManager ${this.status} -> ${newStatus}`);
    this.status = newStatus;
    this.onStatusChangeCallbacks.forEach((callback) => {
      if (typeof callback !== 'function') return;
      callback(newStatus);
    });
  }

  private checkRemoteSyncStatus() {
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
          lastFilesSyncAt || '(no last date provided)'
        }`
      );
      const { hasMore, result } = await this.fetchFilesFromRemote(
        lastFilesSyncAt
      );

      for (const remoteFile of result) {
        // eslint-disable-next-line no-await-in-loop
        await this.createOrUpdateSyncedFileEntry(remoteFile);
        const fileUpdatedAt = new Date(remoteFile.updatedAt);

        Logger.info(`Saving file updatedAt ${fileUpdatedAt}`);
        helpers.saveLastFilesSyncAt(fileUpdatedAt, SYNC_OFFSET_MS);
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
          lastFoldersSyncAt || '(no last date provided)'
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

    Logger.info(
      `Requesting files with params ${JSON.stringify(params, null, 2)}`
    );
    const response = await this.config.httpClient.get(
      `${process.env.NEW_DRIVE_URL}/drive/files`,
      {
        params,
      }
    );

    if (response.status > 299) {
      throw new Error(
        `Fetch files response not ok with body ${JSON.stringify(
          response.data,
          null,
          2
        )} and status ${response.status}`
      );
    }

    if (Array.isArray(response.data)) {
      Logger.info(`Received ${response.data.length} fetched files`);
    } else {
      Logger.info(
        `Expected to receive an array of files, but instead received ${JSON.stringify(
          response,
          null,
          2
        )}`
      );

      throw new Error('Did not receive an array of files');
    }

    const hasMore =
      Array.isArray(response.data) &&
      response.data.length === this.config.fetchFilesLimitPerRequest;

    return {
      hasMore,
      result:
        response.data && Array.isArray(response.data)
          ? response.data.map(this.patchDriveFileResponseItem)
          : [],
    };
  }

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
    Logger.info(
      `Requesting folders with params ${JSON.stringify(params, null, 2)}`
    );
    const response = await this.config.httpClient.get(
      `${process.env.NEW_DRIVE_URL}/drive/folders`,
      {
        params,
      }
    );

    if (response.status > 299) {
      throw new Error(
        `Fetch files response not ok with body ${JSON.stringify(
          response.data,
          null,
          2
        )} and status ${response.status}`
      );
    }

    if (Array.isArray(response.data)) {
      Logger.info(`Received ${response.data.length} fetched folders`);
    } else {
      Logger.info(
        `Expected to receive an array of folders, but instead received ${JSON.stringify(
          response,
          null,
          2
        )}`
      );

      throw new Error('Did not receive an array of folders');
    }

    const hasMore =
      response.data.length === this.config.fetchFilesLimitPerRequest;

    return {
      hasMore,
      result:
        response.data && Array.isArray(response.data)
          ? response.data.map(this.patchDriveFolderResponseItem)
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
    await this.db.files.create(remoteFile);
  }

  private async createOrUpdateSyncedFolderEntry(
    remoteFolder: RemoteSyncedFolder
  ) {
    await this.db.folders.create({
      ...remoteFolder,
      parentId: remoteFolder.parentId ?? undefined,
      bucket: remoteFolder.bucket ?? undefined,
    });
  }
}
