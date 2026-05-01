import { SyncContext } from '@/apps/sync-engine/config';
import { RemoteSyncModule } from '@/backend/features/remote-sync/remote-sync.module';
import { syncRemoteFiles } from './files/sync-remote-files';
import { syncRemoteFolders } from './folders/sync-remote-folders';
import { RemoteSyncStatus } from './helpers';
import { broadcastSyncStatus } from './services/broadcast-sync-status';

export async function startSyncByCheckpoint({ ctx }: { ctx: SyncContext }) {
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

export function changeSyncStatus({ ctx, status }: { ctx: SyncContext; status: RemoteSyncStatus }) {
  if (status === ctx.status) return;

  ctx.logger.debug({
    msg: 'Change syncing status',
    current: ctx.status,
    new: status,
  });

  ctx.status = status;

  broadcastSyncStatus();
}
