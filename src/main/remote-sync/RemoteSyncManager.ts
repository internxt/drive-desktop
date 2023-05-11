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
import { obtainToken } from '../auth/service';
import { DatabaseAdapter } from '../database/adapters/base';

export class RemoteSyncManager {
  private foldersSyncStatus: RemoteSyncStatus = 'IDLE';
  private filesSyncStatus: RemoteSyncStatus = 'IDLE';
  private status: RemoteSyncStatus = 'IDLE';
  private onStatusChangeCallback: (newStatus: RemoteSyncStatus) => void =
    () => {
      return;
    };
  constructor(
    private db: {
      files: DatabaseAdapter<RemoteSyncedFile>;
      folders: DatabaseAdapter<RemoteSyncedFolder>;
    },
    private config: {
      fetchFilesLimitPerRequest: number;
      fetchFoldersLimitPerRequest: number;
      syncFiles: boolean;
      syncFolders: boolean;
    }
  ) {}

  onStatusChange(callback: (newStatus: RemoteSyncStatus) => void) {
    this.onStatusChangeCallback = callback;
  }
  getSyncStatus(): RemoteSyncStatus {
    return this.status;
  }

  isSynced() {
    return this.status === 'SYNCED';
  }

  /**
   * Triggers a remote sync so we can populate the localDB, this sync
   * is global and starts pulling all the files the user has in remote.
   *
   * Throws an error if there's a sync in progress for this class instance
   */
  async startRemoteSync() {
    if (this.status === 'SYNCING') {
      throw new Error(
        'RemoteSyncManager is already SYNCING, wait until the current sync finishes'
      );
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

  private changeStatus(newStatus: RemoteSyncStatus) {
    this.status = newStatus;
    this.onStatusChangeCallback(newStatus);
  }

  private checkRemoteSyncStatus() {
    // We only syncing files
    if (
      this.config.syncFiles &&
      !this.config.syncFolders &&
      this.filesSyncStatus === 'SYNCED'
    ) {
      this.changeStatus('SYNCED');
    }

    // We only syncing folders
    if (
      !this.config.syncFiles &&
      this.config.syncFolders &&
      this.foldersSyncStatus === 'SYNCED'
    ) {
      this.changeStatus('SYNCED');
    }
    // Files and folders are synced, RemoteSync is Synced
    if (
      this.foldersSyncStatus === 'SYNCED' &&
      this.filesSyncStatus === 'SYNCED'
    ) {
      this.changeStatus('SYNCED');
    }

    // Files OR Folders sync failed, RemoteSync Failed
    if (
      this.foldersSyncStatus === 'SYNC_FAILED' ||
      this.filesSyncStatus === 'SYNC_FAILED'
    ) {
      this.changeStatus('SYNC_FAILED');
    }

    Logger.info(`Folders sync status is ${this.foldersSyncStatus}`);
    Logger.info(`Files sync status is ${this.filesSyncStatus}`);
    Logger.info(`RemoteSync status is ${this.status}`);
  }

  /**
   * Syncs all the remote files and saves them into the local db
   * @param syncConfig Config to execute the sync with
   * @returns
   */
  private async syncRemoteFiles(syncConfig: SyncConfig) {
    const lastFilesSyncAt = await helpers.getLastFilesSyncAt();
    try {
      const { hasMore, result } = await this.fetchFilesFromRemote(
        lastFilesSyncAt
      );

      for (const remoteFile of result) {
        // eslint-disable-next-line no-await-in-loop
        await this.createOrUpdateSyncedFileEntry(remoteFile);
        const fileUpdatedAt = new Date(remoteFile.updatedAt);
        if (
          !lastFilesSyncAt ||
          helpers.lastSyncedAtIsNewer(
            fileUpdatedAt,
            lastFilesSyncAt,
            SYNC_OFFSET_MS
          )
        ) {
          Logger.info(`Saving file updatedAt ${fileUpdatedAt}`);
          helpers.saveLastFilesSyncAt(fileUpdatedAt, SYNC_OFFSET_MS);
        }
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
      Logger.error('Remote files sync failed ', error);
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
      const { hasMore, result } = await this.fetchFoldersFromRemote(
        lastFoldersSyncAt
      );

      for (const remoteFolder of result) {
        // eslint-disable-next-line no-await-in-loop
        await this.createOrUpdateSyncedFolderEntry(remoteFolder);
        const foldersUpdatedAt = new Date(remoteFolder.updatedAt);
        if (
          !lastFoldersSyncAt ||
          helpers.lastSyncedAtIsNewer(
            foldersUpdatedAt,
            lastFoldersSyncAt,
            SYNC_OFFSET_MS
          )
        ) {
          Logger.info(`Saving folders updatedAt ${foldersUpdatedAt}`);
          helpers.saveLastFoldersSyncAt(foldersUpdatedAt, SYNC_OFFSET_MS);
        }
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
      Logger.error('Remote folders sync failed ', error);
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
    const token = obtainToken('newToken');

    let query = `?limit=${this.config.fetchFilesLimitPerRequest}&offset=0&status=ALL`;

    if (updatedAtCheckpoint) {
      query += `&updatedAt=${updatedAtCheckpoint.toISOString()}`;
    }

    const path = `${process.env.NEW_DRIVE_URL}/drive/files${query}`;

    const response = await fetch(path, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `Fetch files response not ok with body ${JSON.stringify(data, null, 2)}`
      );
    }

    Logger.info(`Received fetched files ${JSON.stringify(data)}`);
    const hasMore = data.length === this.config.fetchFilesLimitPerRequest;

    return {
      hasMore,
      result: data,
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
    const token = obtainToken('newToken');

    let query = `?limit=${this.config.fetchFilesLimitPerRequest}&offset=0&status=ALL`;

    if (updatedAtCheckpoint) {
      query += `&updatedAt=${updatedAtCheckpoint.toISOString()}`;
    }

    const path = `${process.env.NEW_DRIVE_URL}/drive/folders${query}`;

    const response = await fetch(path, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `Fetch folders response not ok with body ${JSON.stringify(
          data,
          null,
          2
        )}`
      );
    }

    const hasMore = data.length === this.config.fetchFilesLimitPerRequest;

    return {
      hasMore,
      result: data,
    };
  }

  private async createOrUpdateSyncedFileEntry(remoteFile: RemoteSyncedFile) {
    await this.db.files.create(remoteFile);
  }

  private async createOrUpdateSyncedFolderEntry(
    remoteFolder: RemoteSyncedFolder
  ) {
    await this.db.folders.create(remoteFolder);
  }
}
