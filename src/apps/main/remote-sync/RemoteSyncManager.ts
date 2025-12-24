import { logger } from '@internxt/drive-desktop-core/build/backend';
import {
  RemoteSyncStatus,
  RemoteSyncedFolder,
  RemoteSyncedFile,
  SyncConfig,
  rewind,
  SIX_HOURS_IN_MILLISECONDS,
} from './helpers';
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
import { createOrUpdateFolderByBatch } from '../../../infra/sqlite/services/folder/create-or-update-folder-by-batch';
import { createOrUpdateFileByBatch } from '../../../infra/sqlite/services/file/create-or-update-file-by-batch';

export class RemoteSyncManager {
  private foldersSyncStatus: RemoteSyncStatus = 'IDLE';
  private filesSyncStatus: RemoteSyncStatus = 'IDLE';
  private status: RemoteSyncStatus = 'IDLE';
  private onStatusChangeCallbacks: Array<(newStatus: RemoteSyncStatus) => void> = [];
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
    private errorHandler: RemoteSyncErrorHandler,
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

    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Starting' });
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
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Remote sync failed with uncontrolled error: ',
        error,
      });
    } finally {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: `Total synced files: ${this.totalFilesSynced}`,
      });
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: `Total synced folders: ${this.totalFoldersSynced}`,
      });
    }
  }

  /**
   * Run smoke tests before starting the RemoteSyncManager, otherwise fail
   */
  private smokeTest() {
    if (this.status === 'SYNCING') {
      logger.warn({
        tag: 'SYNC-ENGINE',
        msg: 'RemoteSyncManager should not be in SYNCING status to start, not starting again',
      });

      return false;
    }

    return true;
  }

  private changeStatus(newStatus: RemoteSyncStatus) {
    if (newStatus === this.status) return;
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: `RemoteSyncManager ${this.status} -> ${newStatus}`,
    });
    this.status = newStatus;
    this.onStatusChangeCallbacks.forEach((callback) => {
      if (typeof callback !== 'function') return;
      callback(newStatus);
    });
  }

  private checkRemoteSyncStatus() {
    // We only syncing files
    if (this.config.syncFiles && !this.config.syncFolders && this.filesSyncStatus === 'SYNCED') {
      this.changeStatus('SYNCED');
      return;
    }

    // We only syncing folders
    if (!this.config.syncFiles && this.config.syncFolders && this.foldersSyncStatus === 'SYNCED') {
      this.changeStatus('SYNCED');
      return;
    }
    // Files and folders are synced, RemoteSync is Synced
    if (this.foldersSyncStatus === 'SYNCED' && this.filesSyncStatus === 'SYNCED') {
      this.changeStatus('SYNCED');
      return;
    }

    // Files OR Folders sync failed, RemoteSync Failed
    if (this.foldersSyncStatus === 'SYNC_FAILED' || this.filesSyncStatus === 'SYNC_FAILED') {
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
    let fileCheckPoint = from ?? (await this.getFileCheckpoint());
    let hasMore = true;
    let retryCount = 0;

    while (hasMore && retryCount < syncConfig.maxRetries) {
      let lastFileSynced = null;

      try {
        const { hasMore: moreAvailable, result } = await this.fetchFilesFromRemote(fileCheckPoint);

        await createOrUpdateFileByBatch({ files: result });
        this.totalFilesSynced += result.length;
        lastFileSynced = result.length > 0 ? result[result.length - 1] : null;

        hasMore = moreAvailable;

        if (hasMore && lastFileSynced) {
          fileCheckPoint = new Date(lastFileSynced.updatedAt);
        }

        retryCount = 0;
      } catch (error) {
        retryCount++;

        if (error instanceof RemoteSyncError) {
          this.errorHandler.handleSyncError(error, 'files', lastFileSynced?.name ?? 'unknown', fileCheckPoint);
        } else {
          logger.error({
            tag: 'SYNC-ENGINE',
            msg: 'Remote files sync failed with uncontrolled error: ',
            error,
          });
        }

        if (retryCount >= syncConfig.maxRetries) {
          this.filesSyncStatus = 'SYNC_FAILED';
          this.checkRemoteSyncStatus();
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Remote files sync finished',
    });
    this.filesSyncStatus = 'SYNCED';
    this.checkRemoteSyncStatus();
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
    let folderCheckPoint = from ?? (await this.getLastFolderSyncAt());
    let hasMore = true;
    let retryCount = 0;

    while (hasMore && retryCount < syncConfig.maxRetries) {
      let lastFolderSynced = null;

      try {
        const { hasMore: moreAvailable, result } = await this.fetchFoldersFromRemote(folderCheckPoint);

        await createOrUpdateFolderByBatch({ folders: result });
        this.totalFoldersSynced += result.length;
        lastFolderSynced = result.length > 0 ? result[result.length - 1] : null;

        hasMore = moreAvailable;

        if (hasMore && lastFolderSynced) {
          folderCheckPoint = new Date(lastFolderSynced.updatedAt);
        }

        // Reset retry count on successful fetch
        retryCount = 0;
      } catch (error) {
        retryCount++;

        if (error instanceof RemoteSyncError) {
          this.errorHandler.handleSyncError(error, 'folders', lastFolderSynced?.name ?? 'unknown', folderCheckPoint);
        } else {
          logger.error({
            tag: 'SYNC-ENGINE',
            msg: 'Remote folders sync failed with uncontrolled error: ',
            error,
          });
        }

        if (retryCount >= syncConfig.maxRetries) {
          this.foldersSyncStatus = 'SYNC_FAILED';
          this.checkRemoteSyncStatus();
          return;
        }

        // Brief delay before retry to avoid hammering the server
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Remote folders sync finished',
    });
    this.foldersSyncStatus = 'SYNCED';
    this.checkRemoteSyncStatus();
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
      updatedAt: updatedAtCheckpoint ? updatedAtCheckpoint.toISOString() : undefined,
    };

    try {
      const response = await this.config.httpClient.get(`${process.env.NEW_DRIVE_URL}/files`, {
        params,
      });

      if (response.status > 299) {
        throw new RemoteSyncServerError(response.status, response.data);
      }

      if (!Array.isArray(response.data)) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: `Expected to receive an array of files, but received: ${JSON.stringify(response, null, 2)}`,
        });
        throw new RemoteSyncInvalidResponseError(response);
      }

      const hasMore = response.data.length === this.config.fetchFilesLimitPerRequest;

      return {
        hasMore,
        result: response.data && Array.isArray(response.data) ? response.data.map(this.patchDriveFileResponseItem) : [],
      };
    } catch (error) {
      if (error instanceof RemoteSyncError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new RemoteSyncNetworkError(error.message, error.code, error.response?.status);
      }

      throw new RemoteSyncError('Uncontrolled Error in fetchFilesFromRemote', undefined, { originalError: error });
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
      updatedAt: updatedAtCheckpoint ? updatedAtCheckpoint.toISOString() : undefined,
    };
    try {
      const response = await this.config.httpClient.get(`${process.env.NEW_DRIVE_URL}/folders`, {
        params,
      });
      if (response.status > 299) {
        throw new RemoteSyncServerError(response.status, response.data);
      }

      if (!Array.isArray(response.data)) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: `Expected to receive an array of folders, but instead received: ${JSON.stringify(response, null, 2)}`,
        });
        throw new RemoteSyncInvalidResponseError(response);
      }

      const hasMore = response.data.length === this.config.fetchFilesLimitPerRequest;

      return {
        hasMore,
        result:
          response.data && Array.isArray(response.data) ? response.data.map(this.patchDriveFolderResponseItem) : [],
      };
    } catch (error) {
      if (error instanceof RemoteSyncError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new RemoteSyncNetworkError(error.message, error.code, error.response?.status);
      }

      throw new RemoteSyncError('Uncontrolled Error in fetchFoldersFromRemote', undefined, { originalError: error });
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
      fileId: payload.fileId ?? '',
      size: typeof payload.size === 'string' ? parseInt(payload.size) : payload.size,
    };
  };
}
