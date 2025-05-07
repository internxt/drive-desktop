import { RemoteSyncStatus, rewind, FIVETEEN_MINUTES_IN_MILLISECONDS } from './helpers';
import { logger } from '../../shared/logger/logger';
import { SyncRemoteFoldersService } from './folders/sync-remote-folders.service';
import { SyncRemoteFilesService } from './files/sync-remote-files.service';
import { Nullable } from '@/apps/shared/types/Nullable';
import { driveFilesCollection, driveFoldersCollection } from './store';
import { broadcastSyncStatus } from './services/broadcast-sync-status';
import { TWorkerConfig } from '../background-processes/sync-engine/store';

export class RemoteSyncManager {
  status: RemoteSyncStatus = 'IDLE';
  totalFilesSynced = 0;
  private totalFilesUnsynced: string[] = [];
  totalFoldersSynced = 0;

  constructor(
    public readonly worker: TWorkerConfig,
    public readonly workspaceId?: string,
    private readonly syncRemoteFiles = new SyncRemoteFilesService(workspaceId),
    private readonly syncRemoteFolders = new SyncRemoteFoldersService(workspaceId),
  ) {}

  getSyncStatus(): RemoteSyncStatus {
    return this.status;
  }

  getUnSyncFiles(): string[] {
    return this.totalFilesUnsynced;
  }

  async startRemoteSync() {
    logger.debug({ msg: 'Starting remote to local sync', workspaceId: this.workspaceId });

    this.totalFilesSynced = 0;
    this.totalFilesUnsynced = [];
    this.totalFoldersSynced = 0;

    try {
      const syncFilesPromise = this.syncRemoteFiles.run({
        self: this,
        from: await this.getFileCheckpoint(),
      });

      const syncFoldersPromise = this.syncRemoteFolders.run({
        self: this,
        from: await this.getLastFolderSyncAt(),
      });

      const [files, folders] = await Promise.all([syncFilesPromise, syncFoldersPromise]);
      return { files, folders };
    } catch (error) {
      logger.error({ msg: 'Remote sync failed with error', error });
      this.changeStatus('SYNC_FAILED');
    }

    return {
      files: [],
      folders: [],
    };
  }

  changeStatus(newStatus: RemoteSyncStatus) {
    if (newStatus === this.status) return;

    logger.debug({
      msg: 'RemoteSyncManager change status',
      workspaceId: this.workspaceId,
      current: this.status,
      newStatus,
    });

    this.status = newStatus;

    broadcastSyncStatus();
  }

  async getFileCheckpoint(): Promise<Nullable<Date>> {
    const promise = this.workspaceId
      ? driveFilesCollection.getLastUpdatedByWorkspace(this.workspaceId)
      : driveFilesCollection.getLastUpdated();

    const result = await promise;

    if (!result) return undefined;

    const updatedAt = new Date(result.updatedAt);

    return rewind(updatedAt, FIVETEEN_MINUTES_IN_MILLISECONDS);
  }

  private async getLastFolderSyncAt(): Promise<Nullable<Date>> {
    const promise = this.workspaceId
      ? driveFoldersCollection.getLastUpdatedByWorkspace(this.workspaceId)
      : driveFoldersCollection.getLastUpdated();

    const result = await promise;

    if (!result) return undefined;

    const updatedAt = new Date(result.updatedAt);

    return rewind(updatedAt, FIVETEEN_MINUTES_IN_MILLISECONDS);
  }
}
