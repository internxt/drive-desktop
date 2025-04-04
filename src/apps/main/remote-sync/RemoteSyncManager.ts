import { RemoteSyncStatus, rewind, FIVETEEN_MINUTES_IN_MILLISECONDS } from './helpers';
import { logger } from '../../shared/logger/logger';
import { SyncRemoteFoldersService } from './folders/sync-remote-folders.service';
import { FetchRemoteFoldersService } from './folders/fetch-remote-folders.service';
import { SyncRemoteFilesService } from './files/sync-remote-files.service';
import { Nullable } from '@/apps/shared/types/Nullable';
import { FetchWorkspaceFoldersService } from './folders/fetch-workspace-folders.service';
import { QueryFolders } from './folders/fetch-folders.service.interface';
import { driveFilesCollection, driveFoldersCollection } from './store';
import { broadcastStatusChange } from './services/broadcast-status-change';

export class RemoteSyncManager {
  status: RemoteSyncStatus = 'IDLE';
  totalFilesSynced = 0;
  totalFoldersSynced = 0;
  totalFilesUnsynced: string[] = [];
  private lastSyncingFinishedTimestamp: Date | null = null;

  public db = {
    files: driveFilesCollection,
    folders: driveFoldersCollection,
  };

  constructor(
    public workspaceId?: string,
    private readonly syncRemoteFiles = new SyncRemoteFilesService(workspaceId),
    private readonly syncRemoteFolders = new SyncRemoteFoldersService(workspaceId),
    private readonly fetchRemoteFolders = workspaceId ? new FetchWorkspaceFoldersService() : new FetchRemoteFoldersService(),
  ) {}

  resetRemoteSync() {
    this.changeStatus('IDLE');
    this.lastSyncingFinishedTimestamp = null;
    this.totalFilesSynced = 0;
    this.totalFilesUnsynced = [];
    this.totalFoldersSynced = 0;
  }

  async startRemoteSync(folderUuid?: string) {
    logger.debug({ msg: 'Starting remote to local sync', workspaceId: this.workspaceId, folderUuid });

    this.totalFilesSynced = 0;
    this.totalFilesUnsynced = [];
    this.totalFoldersSynced = 0;

    try {
      const syncFilesPromise = this.syncRemoteFiles.run({
        self: this,
        folderUuid,
        from: await this.getFileCheckpoint(),
      });

      const syncFoldersPromise = this.syncRemoteFolders.run({
        self: this,
        folderUuid,
        from: await this.getLastFolderSyncAt(),
      });

      const [files, folders] = await Promise.all([syncFilesPromise, syncFoldersPromise]);
      return { files, folders };
    } catch (error) {
      logger.error({ msg: 'Remote sync failed with error', error });
      this.changeStatus('SYNC_FAILED');
      return {
        files: [],
        folders: [],
      };
    }
  }

  changeStatus(newStatus: RemoteSyncStatus) {
    this.lastSyncingFinishedTimestamp = new Date();

    if (newStatus === this.status) return;

    logger.debug({
      msg: 'RemoteSyncManager change status',
      workspaceId: this.workspaceId,
      current: this.status,
      newStatus,
      lastSyncingFinishedTimestamp: this.lastSyncingFinishedTimestamp,
    });

    this.status = newStatus;

    broadcastStatusChange();
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
    folderUuid,
    offset,
    updatedAtCheckpoint,
    status,
  }: {
    folderUuid: string;
    offset: number;
    updatedAtCheckpoint: Date;
    status: QueryFolders['status'];
  }) {
    return this.fetchRemoteFolders.run({ self: this, offset, folderUuid, updatedAtCheckpoint, status });
  }
}
