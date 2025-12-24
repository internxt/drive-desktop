import { RemoteSyncStatus } from './helpers';
import { broadcastSyncStatus } from './services/broadcast-sync-status';
import { syncRemoteFiles } from './files/sync-remote-files';
import { syncRemoteFolders } from './folders/sync-remote-folders';
import { RemoteSyncModule } from '@/backend/features/remote-sync/remote-sync.module';
import { SyncContext } from '@/apps/sync-engine/config';

export class RemoteSyncManager {
  status: RemoteSyncStatus = 'IDLE';

  constructor(public readonly ctx: SyncContext) {}

  async startRemoteSync({ ctx }: { ctx: SyncContext }) {
    ctx.logger.debug({ msg: 'Starting sync by checkpoint' });

    const syncFilesPromise = syncRemoteFiles({
      ctx,
      from: await RemoteSyncModule.getCheckpoint({ ctx, type: 'file' }),
    });

    const syncFoldersPromise = syncRemoteFolders({
      ctx,
      from: await RemoteSyncModule.getCheckpoint({ ctx, type: 'folder' }),
    });

    await Promise.all([syncFilesPromise, syncFoldersPromise]);
  }

  changeStatus(newStatus: RemoteSyncStatus) {
    if (newStatus === this.status) return;

    this.ctx.logger.debug({
      msg: 'RemoteSyncManager change status',
      current: this.status,
      newStatus,
    });

    this.status = newStatus;

    broadcastSyncStatus();
  }
}
