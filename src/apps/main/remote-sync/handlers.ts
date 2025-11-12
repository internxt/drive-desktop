import { In } from 'typeorm';
import { RemoteSyncManager } from './RemoteSyncManager';
import { ipcMain } from 'electron';
import { updateSyncEngine } from '../background-processes/sync-engine';
import lodashDebounce from 'lodash.debounce';
import { DriveFile } from '../database/entities/DriveFile';
import { ItemBackup } from '../../shared/types/items';
import { logger } from '../../shared/logger/logger';
import Queue from '@/apps/shared/Queue/Queue';
import { driveFilesCollection, getRemoteSyncManager, remoteSyncManagers } from './store';
import { getSyncStatus } from './services/broadcast-sync-status';
import { ipcMainSyncEngine } from '@/apps/sync-engine/ipcMainSyncEngine';
import { SyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

export function addRemoteSyncManager({ context }: { context: SyncContext }) {
  remoteSyncManagers.set(context.workspaceId, new RemoteSyncManager(context, context.workspaceId));
}

type UpdateFileInBatchInput = {
  itemsId: string[];
  file: Partial<DriveFile>;
};

export async function getLocalDangledFiles() {
  const allExisting = await driveFilesCollection.getAll({ status: 'EXISTS', isDangledStatus: true });
  return allExisting;
}

export async function setAsNotDangledFiles(filesIds: string[]) {
  await driveFilesCollection.updateInBatch({
    where: { isDangledStatus: true, fileId: In(filesIds) },
    payload: { isDangledStatus: false },
  });
}

export const updateFileInBatch = async (input: UpdateFileInBatchInput) => {
  const { itemsId, file } = input;

  await driveFilesCollection.updateInBatch({
    where: {
      fileId: In(itemsId),
    },
    payload: file,
  });
};

export const deleteFileInBatch = async (itemsIds: string[]) => {
  await driveFilesCollection.removeInBatch({
    fileId: In(itemsIds),
  });
};

ipcMainSyncEngine.handle('FIND_EXISTING_FILES', async (_, { userUuid, workspaceId }) => {
  const { data: files = [] } = await SqliteModule.FileModule.getByWorkspaceId({ userUuid, workspaceId });
  return files;
});

ipcMainSyncEngine.handle('GET_UPDATED_REMOTE_ITEMS', async (_, { userUuid, workspaceId }) => {
  const [{ data: files = [] }, { data: folders = [] }] = await Promise.all([
    SqliteModule.FileModule.getByWorkspaceId({ userUuid, workspaceId }),
    SqliteModule.FolderModule.getByWorkspaceId({ userUuid, workspaceId }),
  ]);

  return { files, folders };
});

ipcMainSyncEngine.handle('FIND_DANGLED_FILES', async () => {
  const files = await driveFilesCollection.getAll({ status: 'EXISTS', isDangledStatus: true });
  return files;
});

ipcMainSyncEngine.handle('SET_HEALTHY_FILES', async (_, inputData) => {
  await Queue.enqueue(() => setAsNotDangledFiles(inputData));
});

ipcMain.handle('UPDATE_FIXED_FILES', async (_, inputData) => {
  logger.debug({ msg: 'Updating fixed files', inputData });
  await updateFileInBatch({ itemsId: inputData.toUpdate, file: { isDangledStatus: false } });
  await deleteFileInBatch(inputData.toDelete);
});

export async function updateRemoteSync({ workspaceId }: { workspaceId: string }) {
  const manager = getRemoteSyncManager({ workspaceId });
  if (!manager) return;

  try {
    const isSyncing = manager.status === 'SYNCING';

    if (isSyncing) {
      logger.debug({ msg: 'Remote sync is already running', workspaceId });
      return;
    }

    manager.changeStatus('SYNCING');
    await manager.startRemoteSync();
    updateSyncEngine(workspaceId);
  } catch (exc) {
    manager.changeStatus('SYNC_FAILED');
    logger.error({
      msg: 'Error updating remote sync',
      exc,
    });
  }
}

async function updateAllRemoteSync() {
  await Promise.all(
    [...remoteSyncManagers].map(async ([workspaceId]) => {
      await updateRemoteSync({ workspaceId });
    }),
  );
}

export const debouncedSynchronization = lodashDebounce(updateAllRemoteSync, 5000);

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
    pathname: '',
    backupsBucket: folder.bucket,
  }));
});
