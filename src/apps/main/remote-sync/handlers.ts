import { RemoteSyncManager } from './RemoteSyncManager';
import { ipcMain } from 'electron';
import { ItemBackup } from '../../shared/types/items';
import { logger } from '../../shared/logger/logger';
import { remoteSyncManagers } from './store';
import { SyncContext } from '@/apps/sync-engine/config';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { refreshItemPlaceholders } from '@/apps/sync-engine/refresh-item-placeholders';

export function addRemoteSyncManager({ context }: { context: SyncContext }) {
  const remoteSyncManager = new RemoteSyncManager(context);
  remoteSyncManagers.set(context.workspaceId, remoteSyncManager);
  return remoteSyncManager;
}

export async function updateRemoteSync({ manager }: { manager: RemoteSyncManager }) {
  const { ctx } = manager;

  try {
    const isSyncing = manager.status === 'SYNCING';

    if (isSyncing) {
      ctx.logger.debug({ msg: 'Remote sync is already running' });
      return;
    }

    manager.changeStatus('SYNCING');
    await manager.startRemoteSync({ ctx });
    manager.changeStatus('SYNCED');

    await refreshItemPlaceholders({ ctx, isFirstExecution: false });
  } catch (exc) {
    manager.changeStatus('SYNC_FAILED');
    ctx.logger.error({
      msg: 'Error updating remote sync',
      exc,
    });
  }
}

export async function updateAllRemoteSync() {
  await Promise.all(
    remoteSyncManagers.values().map(async (manager) => {
      await updateRemoteSync({ manager });
    }),
  );
}

ipcMain.handle('get-item-by-folder-uuid', async (_, folderUuid): Promise<ItemBackup[]> => {
  logger.debug({ msg: 'Getting items by folder uuid', folderUuid });

  const { data: folder } = await driveServerWip.backup.fetchFolder({ folderUuid });

  if (!folder) return [];

  return folder.children.map((folder) => ({
    id: folder.id,
    uuid: folder.uuid,
    plainName: folder.plainName,
    pathname: '' as AbsolutePath,
  }));
});
