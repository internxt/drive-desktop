import { RemoteSyncStatus, rewind, FIVETEEN_MINUTES_IN_MILLISECONDS } from './helpers';
import { logger } from '../../shared/logger/logger';
import { Nullable } from '@/apps/shared/types/Nullable';
import { driveFilesCollection, driveFoldersCollection } from './store';
import { broadcastSyncStatus } from './services/broadcast-sync-status';
import { TWorkerConfig } from '../background-processes/sync-engine/store';
import { syncRemoteFiles } from './files/sync-remote-files';
import { syncRemoteFolders } from './folders/sync-remote-folders';

export class RemoteSyncManager {
  status: RemoteSyncStatus = 'IDLE';
  totalFilesUnsynced: string[] = [];

  constructor(
    public readonly worker: TWorkerConfig,
    public readonly workspaceId: string,
  ) {}

  async startRemoteSync() {
    logger.debug({ msg: 'Starting remote to local sync', workspaceId: this.workspaceId });

    this.totalFilesUnsynced = [];

    try {
      const syncFilesPromise = syncRemoteFiles({
        self: this,
        from: await this.getFileCheckpoint(),
      });

      const syncFoldersPromise = syncRemoteFolders({
        self: this,
        from: await this.getLastFolderSyncAt(),
      });

      await Promise.all([syncFilesPromise, syncFoldersPromise]);
    } catch (error) {
      logger.error({ msg: 'Remote sync failed with error', error });
      this.changeStatus('SYNC_FAILED');
    }
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
    const result = await driveFilesCollection.getLastUpdatedByWorkspace(this.workspaceId);

    if (!result) return undefined;

    const updatedAt = new Date(result.updatedAt);

    return rewind(updatedAt, FIVETEEN_MINUTES_IN_MILLISECONDS);
  }

  private async getLastFolderSyncAt(): Promise<Nullable<Date>> {
    const result = await driveFoldersCollection.getLastUpdatedByWorkspace(this.workspaceId);

    if (!result) return undefined;

    const updatedAt = new Date(result.updatedAt);

    return rewind(updatedAt, FIVETEEN_MINUTES_IN_MILLISECONDS);
  }
}
