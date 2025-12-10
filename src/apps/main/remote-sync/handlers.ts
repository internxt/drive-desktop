import { RemoteSyncManager } from './RemoteSyncManager';
import { ipcMain } from 'electron';
import { ItemBackup } from '../../shared/types/items';
import { logger } from '../../shared/logger/logger';
import { remoteSyncManagers } from './store';
import { getSyncStatus } from './services/broadcast-sync-status';
import { ipcMainSyncEngine } from '@/apps/sync-engine/ipcMainSyncEngine';
import { SyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { refreshItemPlaceholders } from '@/apps/sync-engine/refresh-item-placeholders';

export function addRemoteSyncManager({ context }: { context: SyncContext }) {
  const remoteSyncManager = new RemoteSyncManager(context, context.workspaceId);
  remoteSyncManagers.set(context.workspaceId, remoteSyncManager);
  return remoteSyncManager;
}

ipcMainSyncEngine.handle('FIND_EXISTING_FILES', async (_, { userUuid, workspaceId }) => {
  const { data: files = [] } = await SqliteModule.FileModule.getByWorkspaceId({ userUuid, workspaceId });
  return files;
});

export async function updateRemoteSync({ manager }: { manager: RemoteSyncManager }) {
  try {
    const isSyncing = manager.status === 'SYNCING';

    if (isSyncing) {
      logger.debug({ msg: 'Remote sync is already running', workspaceId: manager.workspaceId });
      return;
    }

    manager.changeStatus('SYNCING');
    await manager.startRemoteSync();
    manager.changeStatus('SYNCED');

    await refreshItemPlaceholders({ ctx: manager.context });
  } catch (exc) {
    manager.changeStatus('SYNC_FAILED');
    logger.error({
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

ipcMain.handle('get-remote-sync-status', () => {
  return getSyncStatus();
});

ipcMain.handle('SYNC_MANUALLY', async () => {
  logger.debug({ msg: '[Manual Sync] Received manual sync event' });
  await updateAllRemoteSync();
});

ipcMain.handle('get-item-by-folder-uuid', async (_, folderUuid): Promise<ItemBackup[]> => {
  logger.debug({ msg: 'Getting items by folder uuid', folderUuid });

  const { data: folder } = await driveServerWip.backup.fetchFolder({ folderUuid });

  if (!folder) return [];

  return folder.children.map((folder) => ({
    id: folder.id,
    uuid: folder.uuid,
    plainName: folder.plainName,
    tmpPath: '',
    pathname: '' as AbsolutePath,
    backupsBucket: folder.bucket,
  }));
});
