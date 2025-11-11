import { RemoteSyncStatus } from './helpers';
import { logger } from '../../shared/logger/logger';
import { broadcastSyncStatus } from './services/broadcast-sync-status';
import { syncRemoteFiles } from './files/sync-remote-files';
import { syncRemoteFolders } from './folders/sync-remote-folders';
import { RemoteSyncModule } from '@/backend/features/remote-sync/remote-sync.module';
import { SyncContext } from '@/apps/sync-engine/config';

export class RemoteSyncManager {
  status: RemoteSyncStatus = 'IDLE';

  constructor(
    public readonly context: SyncContext,
    public readonly workspaceId: string,
  ) {}

  async startRemoteSync() {
    logger.debug({ msg: 'Starting remote to local sync', workspaceId: this.workspaceId });

    try {
      const syncFilesPromise = syncRemoteFiles({
        self: this,
        from: await RemoteSyncModule.getCheckpoint({
          ctx: this.context,
          type: 'file',
        }),
      });

      const syncFoldersPromise = syncRemoteFolders({
        self: this,
        from: await RemoteSyncModule.getCheckpoint({
          ctx: this.context,
          type: 'folder',
        }),
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
}
