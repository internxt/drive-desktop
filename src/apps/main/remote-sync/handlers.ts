import { changeSyncStatus, startSyncByCheckpoint } from './RemoteSyncManager';
import { ipcMain } from 'electron';
import { ItemBackup } from '../../shared/types/items';
import { logger } from '../../shared/logger/logger';
import { workers } from './store';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { refreshItemPlaceholders } from '@/apps/sync-engine/refresh-item-placeholders';
import { SyncContext } from '@/apps/sync-engine/config';

export async function updateRemoteSync({ ctx }: { ctx: SyncContext }) {
  try {
    const isSyncing = ctx.status === 'SYNCING';

    if (isSyncing) {
      ctx.logger.debug({ msg: 'Remote sync is already running' });
      return;
    }

    changeSyncStatus({ ctx, status: 'SYNCING' });
    await startSyncByCheckpoint({ ctx });
    changeSyncStatus({ ctx, status: 'SYNCED' });

    await refreshItemPlaceholders({ ctx, isFirstExecution: false });
  } catch (error) {
    changeSyncStatus({ ctx, status: 'SYNC_FAILED' });
    ctx.logger.error({ msg: 'Error updating remote sync', error });
  }
}

export async function updateAllRemoteSync() {
  await Promise.all(
    workers.values().map(async ({ ctx }) => {
      await updateRemoteSync({ ctx });
    }),
  );
}

export function setupRemoteSyncIpc() {
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
}
