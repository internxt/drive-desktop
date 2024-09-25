import Logger from 'electron-log';
import {
  RemoteSyncStatus,
  RemoteSyncedFolder,
  RemoteSyncedFile,
  SyncConfig,
  rewind,
  WAITING_AFTER_SYNCING_DEFAULT,
  SIX_HOURS_IN_MILLISECONDS,
} from './helpers';
import { reportError } from '../bug-report/service';

import { DatabaseCollectionAdapter } from '../database/adapters/base';
import { Axios } from 'axios';
import { DriveFolder } from '../database/entities/DriveFolder';
import { DriveFile } from '../database/entities/DriveFile';
import { Nullable } from '../../shared/types/Nullable';

export class RemoteSyncManager {
  private foldersSyncStatus: RemoteSyncStatus = 'IDLE';
  private filesSyncStatus: RemoteSyncStatus = 'IDLE';
  private _placeholdersStatus: RemoteSyncStatus = 'IDLE';
  private status: RemoteSyncStatus = 'IDLE';
  private onStatusChangeCallbacks: Array<
    (newStatus: RemoteSyncStatus) => void
  > = [];
  private totalFilesSynced = 0;
  private totalFilesUnsynced: string[] = [];
  private totalFoldersSynced = 0;
  private lastSyncingFinishedTimestamp: Date | null = null;
  private _isProcessRunning = false;

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
   * @param milliseconds Time in milliseconds to check if the RemoteSyncManager was syncing
   */
  recentlyWasSyncing(milliseconds: number) {
    const passedTime =
      Date.now() -
      (this.getLastSyncingFinishedTimestamp()?.getTime() ?? Date.now());
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
  async startRemoteSync(folderId?: number) {
    // const start = Date.now();
    Logger.info('Starting remote to local sync');
    Logger.info('Checking if we are in a valid state to start the sync');

    const testPassed = this.smokeTest();

    if (!testPassed && !folderId) {
      return {
        files: [],
        folders: [],
      };
    }
    this.totalFilesSynced = 0;
    this.totalFilesUnsynced = [];
    this.totalFoldersSynced = 0;
    await this.db.files.connect();
    await this.db.folders.connect();

    Logger.info('Starting RemoteSyncManager');
    try {
      const syncOptions = {
        retry: 1,
        maxRetries: 3,
      };

      const syncFilesPromise = folderId
        ? this.syncRemoteFilesByFolder(syncOptions, folderId)
        : this.syncRemoteFiles(syncOptions);

      const syncFoldersPromise = folderId
        ? this.syncRemoteFoldersByFolder(syncOptions, folderId)
        : this.syncRemoteFolders(syncOptions);

      const [files, folders] = await Promise.all([
        await syncFilesPromise,
        await syncFoldersPromise,
      ]);
      return { files, folders };
    } catch (error) {
      this.changeStatus('SYNC_FAILED');
      reportError(error as Error);
    } finally {
      Logger.info('Total synced files: ', this.totalFilesSynced);
      Logger.info('Total unsynced files: ', this.totalFilesUnsynced);
      Logger.info('Total synced folders: ', this.totalFoldersSynced);
    }
    return {
      files: [],
      folders: [],
    };
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

  set isProcessRunning(value: boolean) {
    this.changeStatus(value ? 'SYNCING' : 'SYNCED');
    this._isProcessRunning = value;
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

  async getFileCheckpoint(): Promise<Nullable<Date>> {
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

  private async syncRemoteFiles(
    syncConfig: SyncConfig,
    from?: Date
  ): Promise<undefined | RemoteSyncedFile[]> {
    const fileCheckpoint = from ?? (await this.getFileCheckpoint());
    let offset = 0;
    let hasMore = true;
    const allResults: RemoteSyncedFile[] = [];

    try {
      Logger.info(
        `Syncing files updated from ${
          fileCheckpoint ?? '(no last date provided)'
        }`
      );

      while (hasMore) {
        const { hasMore: newHasMore, result } = await this.fetchFilesFromRemote(
          fileCheckpoint,
          offset
        );

        for (const remoteFile of result) {
          // eslint-disable-next-line no-await-in-loop
          await this.createOrUpdateSyncedFileEntry(remoteFile);
          this.totalFilesSynced++;
        }

        allResults.push(...result);
        hasMore = newHasMore;
        offset += this.config.fetchFilesLimitPerRequest;

        if (hasMore) {
          Logger.info('Retrieving more files for sync');
        }
      }

      Logger.info('Remote files sync finished');
      return allResults;
    } catch (error) {
      Logger.error('Remote files sync failed with error: ', error);

      reportError(error as Error, {
        lastFilesSyncAt: fileCheckpoint
          ? fileCheckpoint.toISOString()
          : 'INITIAL_FILES_SYNC',
      });

      if (syncConfig.retry >= syncConfig.maxRetries) {
        // No more retries allowed,
        this.filesSyncStatus = 'SYNC_FAILED';
        this.checkRemoteSyncStatus();
        return;
      }

      return await this.syncRemoteFiles(
        {
          retry: syncConfig.retry + 1,
          maxRetries: syncConfig.maxRetries,
        },
        from
      );
    }
  }

  private async syncRemoteFilesByFolder(
    syncConfig: SyncConfig,
    folderId: number,
    from?: Date
  ): Promise<undefined | RemoteSyncedFile[]> {
    const fileCheckpoint = from ?? (await this.getFileCheckpoint());
    let offset = 0;
    let hasMore = true;
    const allResults: RemoteSyncedFile[] = [];

    try {
      Logger.info(
        `Syncing files updated from ${
          fileCheckpoint
            ? fileCheckpoint.toISOString()
            : '(no last date provided)'
        }`
      );

      while (hasMore) {
        const { hasMore: newHasMore, result } =
          await this.fetchFilesByFolderFromRemote(
            folderId,
            fileCheckpoint,
            offset
          );

        for (const remoteFile of result) {
          // eslint-disable-next-line no-await-in-loop
          await this.createOrUpdateSyncedFileEntry(remoteFile);
          this.totalFilesSynced++;
        }

        allResults.push(...result);
        hasMore = newHasMore;
        offset += this.config.fetchFilesLimitPerRequest;

        if (hasMore) {
          Logger.info('Retrieving more files for sync');
        }
      }

      Logger.info('Remote files sync finished');

      return allResults;
    } catch (error) {
      Logger.error('Remote files sync failed with error: ', error);

      reportError(error as Error, {
        lastFilesSyncAt: fileCheckpoint
          ? fileCheckpoint.toISOString()
          : 'INITIAL_FILES_SYNC',
      });

      if (syncConfig.retry >= syncConfig.maxRetries) {
        // No more retries allowed,
        this.filesSyncStatus = 'SYNC_FAILED';
        this.checkRemoteSyncStatus();
        return;
      }

      return await this.syncRemoteFilesByFolder(
        {
          retry: syncConfig.retry + 1,
          maxRetries: syncConfig.maxRetries,
        },
        folderId,
        from
      );
    }
  }

  private async getLastFolderSyncAt(): Promise<Nullable<Date>> {
    const { success, result } = await this.db.folders.getLastUpdated();

    if (!success) return undefined;

    if (!result) return undefined;

    const updatedAt = new Date(result.updatedAt);

    return rewind(updatedAt, SIX_HOURS_IN_MILLISECONDS);
  }

  private async syncRemoteFolders(
    syncConfig: SyncConfig,
    from?: Date
  ): Promise<undefined | RemoteSyncedFolder[]> {
    const lastFolderSyncAt = from ?? (await this.getLastFolderSyncAt());
    let offset = 0;
    let hasMore = true;
    const allResults: RemoteSyncedFolder[] = [];

    try {
      Logger.info(
        `Syncing folders updated from ${
          lastFolderSyncAt
            ? lastFolderSyncAt.toISOString()
            : '(no last date provided)'
        }`
      );

      while (hasMore) {
        const { hasMore: newHasMore, result } =
          await this.fetchFoldersFromRemote(lastFolderSyncAt, offset);

        for (const remoteFolder of result) {
          // eslint-disable-next-line no-await-in-loop
          await this.createOrUpdateSyncedFolderEntry(remoteFolder);
          this.totalFoldersSynced++;
        }

        allResults.push(...result);
        hasMore = newHasMore;
        offset += this.config.fetchFilesLimitPerRequest;

        if (hasMore) {
          Logger.info('Retrieving more folders for sync');
        }
      }
      return allResults;
    } catch (error) {
      Logger.error('Remote folders sync failed with error: ', error);
      reportError(error as Error, {
        lastFoldersSyncAt: lastFolderSyncAt
          ? lastFolderSyncAt.toISOString()
          : 'INITIAL_FOLDERS_SYNC',
      });

      if (syncConfig.retry >= syncConfig.maxRetries) {
        // No more retries allowed,
        this.foldersSyncStatus = 'SYNC_FAILED';
        this.checkRemoteSyncStatus();
        return;
      }

      return await this.syncRemoteFolders(
        {
          retry: syncConfig.retry + 1,
          maxRetries: syncConfig.maxRetries,
        },
        from
      );
    }
  }

  private async syncRemoteFoldersByFolder(
    syncConfig: SyncConfig,
    folderId: number,
    from?: Date
  ): Promise<undefined | RemoteSyncedFolder[]> {
    const lastFolderSyncAt = from ?? (await this.getLastFolderSyncAt());
    let offset = 0;
    let hasMore = true;
    const allResults: RemoteSyncedFolder[] = [];

    try {
      Logger.info(
        `Syncing folders updated from ${
          lastFolderSyncAt
            ? lastFolderSyncAt.toISOString()
            : '(no last date provided)'
        }`
      );

      while (hasMore) {
        const { hasMore: newHasMore, result } =
          await this.fetchFoldersByFolderFromRemote(
            folderId,
            lastFolderSyncAt,
            offset
          );

        for (const remoteFolder of result) {
          // eslint-disable-next-line no-await-in-loop
          await this.createOrUpdateSyncedFolderEntry(remoteFolder);
          this.totalFoldersSynced++;
        }

        allResults.push(...result);
        hasMore = newHasMore;
        offset += this.config.fetchFilesLimitPerRequest;

        if (hasMore) {
          Logger.info('Retrieving more folders for sync');
        }
      }
      return allResults;
    } catch (error) {
      Logger.error('Remote folders sync failed with error: ', error);
      reportError(error as Error, {
        lastFoldersSyncAt: lastFolderSyncAt
          ? lastFolderSyncAt.toISOString()
          : 'INITIAL_FOLDERS_SYNC',
      });

      if (syncConfig.retry >= syncConfig.maxRetries) {
        // No more retries allowed,
        this.foldersSyncStatus = 'SYNC_FAILED';
        this.checkRemoteSyncStatus();
        return;
      }

      return await this.syncRemoteFoldersByFolder(
        {
          retry: syncConfig.retry + 1,
          maxRetries: syncConfig.maxRetries,
        },
        folderId,
        from
      );
    }
  }

  /**
   * Fetch the files that were updated after the given date
   *
   * @param updatedAtCheckpoint Retrieve files that were updated after this date
   */
  private async fetchFilesFromRemote(
    updatedAtCheckpoint?: Date,
    offset = 0
  ): Promise<{
    hasMore: boolean;
    result: RemoteSyncedFile[];
  }> {
    const params = {
      limit: this.config.fetchFilesLimitPerRequest,
      offset,
      status: 'ALL',
      updatedAt: updatedAtCheckpoint ?? undefined,
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

  /**
   * Fetch the files that were updated after the given date
   *
   * @param updatedAtCheckpoint Retrieve files that were updated after this date
   */
  private async fetchFilesByFolderFromRemote(
    folderId: number,
    updatedAtCheckpoint?: Date,
    offset = 0
  ): Promise<{
    hasMore: boolean;
    result: RemoteSyncedFile[];
  }> {
    const params = {
      limit: this.config.fetchFilesLimitPerRequest,
      offset,
      status: 'ALL',
      updatedAt: updatedAtCheckpoint
        ? updatedAtCheckpoint.toISOString()
        : undefined,
    };
    const allFilesResponse = await this.fetchItemsByFolder(
      params,
      folderId,
      'files'
    );
    if (allFilesResponse.status > 299) {
      throw new Error(
        `Fetch files response not ok with body ${JSON.stringify(
          allFilesResponse.data,
          null,
          2
        )} and status ${allFilesResponse.status}`
      );
    }

    if (Array.isArray(allFilesResponse.data.result)) {
      Logger.info(
        `Received ${allFilesResponse.data.result.length} fetched files`
      );
    } else {
      // Logger.info(
      //   `Expected to receive an array of files, but instead received ${JSON.stringify(
      //     allFilesResponse,
      //     null,
      //     2
      //   )}`
      // );

      throw new Error('Did not receive an array of files');
    }

    const hasMore =
      allFilesResponse.data.result.length ===
      this.config.fetchFilesLimitPerRequest;

    return {
      hasMore,
      result:
        allFilesResponse.data.result &&
        Array.isArray(allFilesResponse.data.result)
          ? allFilesResponse.data.result.map(this.patchDriveFileResponseItem)
          : [],
    };
  }

  private fetchItems = async (
    params: {
      limit: number;
      offset: number;
      status: string;
      updatedAt: string | undefined | Date;
    },
    type: 'files' | 'folders'
  ) => {
    const response = await this.config.httpClient.get(
      `${process.env.NEW_DRIVE_URL}/drive/${type}`,
      { params }
    );
    Logger.info(
      `Fetching item ${type} response: ${JSON.stringify(
        response.data?.length,
        null,
        2
      )}`
    );
    return response;
  };

  private fetchItemsByFolder = async (
    params: {
      limit: number;
      offset: number;
      status: string;
      updatedAt: string | undefined;
    },
    folderId: number,
    type: 'files' | 'folders'
  ) => {
    const response = await this.config.httpClient.get(
      `${process.env.NEW_DRIVE_URL}/drive/folders/${folderId}/${type}`,
      { params: { ...params, sort: 'ASC' } }
    );
    Logger.info(
      `Fetching by folder ${type} by folder response: ${JSON.stringify(
        response.data.result?.length,
        null,
        2
      )}`
    );
    return response;
  };

  /**
   * Fetch the folders that were updated after the given date
   *
   * @param updatedAtCheckpoint Retrieve folders that were updated after this date
   */
  private async fetchFoldersFromRemote(
    updatedAtCheckpoint?: Date,
    offset = 0
  ): Promise<{
    hasMore: boolean;
    result: RemoteSyncedFolder[];
  }> {
    const params = {
      limit: this.config.fetchFilesLimitPerRequest,
      offset,
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
  private async fetchFoldersByFolderFromRemote(
    folderId: number,
    updatedAtCheckpoint?: Date,
    offset = 0
  ): Promise<{
    hasMore: boolean;
    result: RemoteSyncedFolder[];
  }> {
    const params = {
      limit: this.config.fetchFilesLimitPerRequest,
      offset,
      status: 'ALL',
      updatedAt: undefined,
    };

    const allFoldersResponse = await this.fetchItemsByFolder(
      params,
      folderId,
      'folders'
    );

    if (allFoldersResponse.status > 299) {
      throw new Error(
        `Fetch files response not ok with body ${JSON.stringify(
          allFoldersResponse.data.result,
          null,
          2
        )} and status ${allFoldersResponse.status}`
      );
    }

    if (Array.isArray(allFoldersResponse.data.result)) {
      Logger.info(
        `Received ${allFoldersResponse.data.result.length} fetched files`
      );
    } else {
      Logger.info(
        `Expected to receive an array of files, but instead received ${JSON.stringify(
          allFoldersResponse.status,
          null,
          2
        )}`
      );

      throw new Error('Did not receive an array of files');
    }

    const hasMore =
      allFoldersResponse.data.result.length ===
      this.config.fetchFilesLimitPerRequest;

    return {
      hasMore,
      result:
        allFoldersResponse.data.result &&
        Array.isArray(allFoldersResponse.data.result)
          ? allFoldersResponse.data.result.map(
              this.patchDriveFolderResponseItem
            )
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
      type: remoteFolder.type ?? 'folder',
      parentId: remoteFolder.parentId ?? undefined,
      bucket: remoteFolder.bucket ?? undefined,
    });
  }
}
