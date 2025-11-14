import { RemoteSyncStatus } from './helpers';
import { logger } from '../../shared/logger/logger';
import { broadcastSyncStatus } from './services/broadcast-sync-status';
import { syncRemoteFiles } from './files/sync-remote-files';
import { syncRemoteFolders } from './folders/sync-remote-folders';
import { RemoteSyncModule } from '@/backend/features/remote-sync/remote-sync.module';
import { Config } from '@/apps/sync-engine/config';

export class RemoteSyncManager {
  status: RemoteSyncStatus = 'IDLE';

  constructor(
    public readonly context: Config,
    public readonly workspaceId: string,
  ) {}

  async startRemoteSync() {
    logger.debug({ msg: 'Starting remote to local sync', workspaceId: this.workspaceId });

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
