import Logger from 'electron-log';
import {
  RemoteSyncStatus,
  RemoteSyncedFolder,
  RemoteSyncedFile,
  SyncConfig,
  rewind,
  SIX_HOURS_IN_MILLISECONDS,
} from './helpers';
import { reportError } from '../bug-report/service';
import { DatabaseCollectionAdapter } from '../database/adapters/base';
import axios, { Axios } from 'axios';
import { DriveFolder } from '../database/entities/DriveFolder';
import { DriveFile } from '../database/entities/DriveFile';
import { Nullable } from '../../shared/types/Nullable';
import {
  RemoteSyncError,
  RemoteSyncInvalidResponseError,
  RemoteSyncNetworkError,
  RemoteSyncServerError,
} from './errors';
import { RemoteSyncErrorHandler } from './RemoteSyncErrorHandler/RemoteSyncErrorHandler';

export class RemoteSyncManager {
  private foldersSyncStatus: RemoteSyncStatus = 'IDLE';
  private filesSyncStatus: RemoteSyncStatus = 'IDLE';
  private status: RemoteSyncStatus = 'IDLE';
  private onStatusChangeCallbacks: Array<
    (newStatus: RemoteSyncStatus) => void
  > = [];
  private totalFilesSynced = 0;
  private totalFoldersSynced = 0;

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
    },
    private errorHandler: RemoteSyncErrorHandler
  ) {}

  getTotalFilesSynced() {
    return this.totalFilesSynced;
  }

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

  resetRemoteSync() {
    this.changeStatus('IDLE');
    this.filesSyncStatus = 'IDLE';
    this.foldersSyncStatus = 'IDLE';
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
    const testPassed = this.smokeTest();

    if (!testPassed) {
      return;
    }
    this.totalFilesSynced = 0;
    this.totalFoldersSynced = 0;
    await this.db.files.connect();
    await this.db.folders.connect();

    Logger.info('[SYNC MANAGER] Starting');
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
      Logger.info('[SYNC MANAGER] Total synced files: ', this.totalFilesSynced);
      Logger.info(
        '[SYNC MANAGER] Total synced folders: ',
        this.totalFoldersSynced
      );
    }
  }

  /**
   * Run smoke tests before starting the RemoteSyncManager, otherwise fail
   */
  private smokeTest() {
    if (this.status === 'SYNCING') {
      Logger.warn(
        '[SYNC MANAGER] RemoteSyncManager should not be in SYNCING status to start, not starting again'
      );

      return false;
    }

    return true;
  }

  private changeStatus(newStatus: RemoteSyncStatus) {
    if (newStatus === this.status) return;
    Logger.info(
      `[SYNC MANAGER] RemoteSyncManager ${this.status} -> ${newStatus}`
    );
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

  private async getFileCheckpoint(): Promise<Nullable<Date>> {
    const { success, result } = await this.db.files.getLastUpdated();

    if (!success) return undefined;

    if (!result) return undefined;

    const updatedAt = new Date(result.updatedAt);

    return rewind(updatedAt, SIX_HOURS_IN_MILLISECONDS);
  }

  /**
   * Syncs all the remote files and saves them into the local db
   * @param syncConfig Config to execute the sync with
   * @returns
   */
  private async syncRemoteFiles(syncConfig: SyncConfig, from?: Date) {
    const fileCheckPoint = from ?? (await this.getFileCheckpoint());
    let lastFileSynced = null;

    try {
      const { hasMore, result } = await this.fetchFilesFromRemote(
        fileCheckPoint
      );

      for (const remoteFile of result) {
        // eslint-disable-next-line no-await-in-loop
        await this.createOrUpdateSyncedFileEntry(remoteFile);

        this.totalFilesSynced++;
        lastFileSynced = remoteFile;
      }

      if (!hasMore) {
        Logger.info('[SYNC MANAGER] Remote files sync finished');
        this.filesSyncStatus = 'SYNCED';
        this.checkRemoteSyncStatus();
        return;
      }
      await this.syncRemoteFiles(
        {
          retry: 1,
          maxRetries: syncConfig.maxRetries,
        },
        lastFileSynced ? new Date(lastFileSynced.updatedAt) : undefined
      );
    } catch (error) {
      if (error instanceof RemoteSyncError) {
        this.errorHandler.handleSyncError(
          error,
          'files',
          lastFileSynced?.name ?? 'unknown',
          fileCheckPoint
        );
      } else {
        Logger.error(
          '[SYNC MANAGER] Remote files sync failed with uncontrolled error: ',
          error
        );
      }
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

  private async getLastFolderSyncAt(): Promise<Nullable<Date>> {
    const { success, result } = await this.db.folders.getLastUpdated();

    if (!success) return undefined;

    if (!result) return undefined;

    const updatedAt = new Date(result.updatedAt);
    return rewind(updatedAt, SIX_HOURS_IN_MILLISECONDS);
  }

  /**
   * Syncs all the remote folders and saves them into the local db
   * @param syncConfig Config to execute the sync with
   * @returns
   */
  private async syncRemoteFolders(syncConfig: SyncConfig, from?: Date) {
    const folderCheckPoint = from ?? (await this.getLastFolderSyncAt());
    let lastFolderSynced = null;

    try {
      const { hasMore, result } = await this.fetchFoldersFromRemote(
        folderCheckPoint
      );

      for (const remoteFolder of result) {
        // eslint-disable-next-line no-await-in-loop
        await this.createOrUpdateSyncedFolderEntry(remoteFolder);

        this.totalFoldersSynced++;
        lastFolderSynced = remoteFolder;
      }

      if (!hasMore) {
        this.foldersSyncStatus = 'SYNCED';
        this.checkRemoteSyncStatus();
        return;
      }

      await this.syncRemoteFolders(
        {
          retry: 1,
          maxRetries: syncConfig.maxRetries,
        },
        lastFolderSynced ? new Date(lastFolderSynced.updatedAt) : undefined
      );
    } catch (error) {
      if (error instanceof RemoteSyncError) {
        this.errorHandler.handleSyncError(
          error,
          'folders',
          lastFolderSynced?.name ?? 'unknown',
          folderCheckPoint
        );
      } else {
        Logger.error(
          '[SYNC MANAGER] Remote folders sync failed with uncontrolled error: ',
          error
        );
      }

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

    try {
      const response = await this.config.httpClient.get(
        `${process.env.NEW_DRIVE_URL}/files`,
        {
          params,
        }
      );

      if (response.status > 299) {
        throw new RemoteSyncServerError(response.status, response.data);
      }

      if (!Array.isArray(response.data)) {
        Logger.info(
          `[SYNC MANAGER] Expected to receive an array of files, but received: ${JSON.stringify(
            response,
            null,
            2
          )}`
        );
        throw new RemoteSyncInvalidResponseError(response);
      }

      const hasMore =
        response.data.length === this.config.fetchFilesLimitPerRequest;

      return {
        hasMore,
        result:
          response.data && Array.isArray(response.data)
            ? response.data.map(this.patchDriveFileResponseItem)
            : [],
      };
    } catch (error) {
      if (error instanceof RemoteSyncError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new RemoteSyncNetworkError(error);
      }

      throw new RemoteSyncError(
        'Uncontrolled Error in fetchFilesFromRemote',
        undefined,
        { originalError: error }
      );
    }
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
    try {
      const response = await this.config.httpClient.get(
        `${process.env.NEW_DRIVE_URL}/folders`,
        {
          params,
        }
      );
      if (response.status > 299) {
        throw new RemoteSyncServerError(response.status, response.data);
      }

      if (!Array.isArray(response.data)) {
        Logger.info(
          `[SYNC MANAGER] Expected to receive an array of folders, but instead received: ${JSON.stringify(
            response,
            null,
            2
          )}`
        );
        throw new RemoteSyncInvalidResponseError(response);
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
    } catch (error) {
      if (error instanceof RemoteSyncError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new RemoteSyncNetworkError(error);
      }

      throw new RemoteSyncError(
        'Uncontrolled Error in fetchFilesFromRemote',
        undefined,
        { originalError: error }
      );
    }
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
