import { In } from 'typeorm';
/* eslint-disable no-use-before-define */
import eventBus from '../event-bus';
import { RemoteSyncManager } from './RemoteSyncManager';
import { ipcMain } from 'electron';
import { spawnDefaultSyncEngineWorker, spawnWorkspaceSyncEngineWorkers, updateSyncEngine } from '../background-processes/sync-engine';
import lodashDebounce from 'lodash.debounce';
import { DriveFile } from '../database/entities/DriveFile';
import { ItemBackup } from '../../shared/types/items';
import { logger } from '../../shared/logger/logger';
import Queue from '@/apps/shared/Queue/Queue';
import { driveFilesCollection, getRemoteSyncManager, remoteSyncManagers } from './store';
import { TWorkerConfig } from '../background-processes/sync-engine/store';
import { getSyncStatus } from './services/broadcast-sync-status';
import { fetchItems } from '@/apps/backups/fetch-items/fetch-items';
import { ipcMainSyncEngine } from '@/apps/sync-engine/ipcMainSyncEngine';
import { SyncContext } from '@/apps/sync-engine/config';
import { AuthContext } from '@/backend/features/auth/utils/context';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import VirtualDrive from '@/node-win/virtual-drive';

export function addRemoteSyncManager({ context, worker }: { context: SyncContext; worker: TWorkerConfig }) {
  remoteSyncManagers.set(context.workspaceId, new RemoteSyncManager(context, worker, context.workspaceId));
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

export async function getUpdatedRemoteItems(workspaceId: string) {
  try {
    const promise = Promise.all([
      SqliteModule.FileModule.getByWorkspaceId({ workspaceId }),
      SqliteModule.FolderModule.getByWorkspaceId({ workspaceId }),
    ]);

    const [{ data: files = [] }, { data: folders = [] }] = await promise;

    return { files, folders };
  } catch (error) {
    throw logger.error({
      msg: 'Error getting updated remote items',
      exc: error,
    });
  }
}

void ipcMainSyncEngine.handle('FIND_DANGLED_FILES', async () => {
  return await getLocalDangledFiles();
});

void ipcMainSyncEngine.handle('SET_HEALTHY_FILES', async (_, inputData) => {
  await Queue.enqueue(() => setAsNotDangledFiles(inputData));
});

ipcMain.handle('UPDATE_FIXED_FILES', async (_, inputData) => {
  logger.debug({ msg: 'Updating fixed files', inputData });
  await updateFileInBatch({ itemsId: inputData.toUpdate, file: { isDangledStatus: false } });
  await deleteFileInBatch(inputData.toDelete);
});

ipcMain.handle('GET_UPDATED_REMOTE_ITEMS', (_, workspaceId: string) => {
  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Getting updated remote items',
    workspaceId,
  });

  return getUpdatedRemoteItems(workspaceId);
});

async function updateRemoteSync({ workspaceId }: { workspaceId: string }) {
  const manager = getRemoteSyncManager({ workspaceId });
  if (!manager) return;

  try {
    const isSyncing = checkSyncInProgress({ workspaceId });

    if (isSyncing) {
      logger.debug({ msg: 'Remote sync is already running', workspaceId });
      return;
    }

    manager.changeStatus('SYNCING');
    await startRemoteSync({ workspaceId });
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

async function startRemoteSync({ workspaceId }: { workspaceId: string }): Promise<void> {
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');

  try {
    await manager.startRemoteSync();

    logger.debug({
      msg: 'Remote sync finished',
      workspaceId,
    });
  } catch (error) {
    throw logger.error({
      msg: 'Error starting remote sync',
      exc: error,
    });
  }
}

ipcMain.handle('get-remote-sync-status', () => {
  return getSyncStatus();
});

ipcMain.handle('SYNC_MANUALLY', async () => {
  logger.debug({ msg: '[Manual Sync] Received manual sync event' });
  await updateAllRemoteSync();
});

ipcMain.handle('GET_UNSYNC_FILE_IN_SYNC_ENGINE', (_, workspaceId = '') => {
  logger.debug({ msg: '[Get UnSync] Received Get UnSync File event' });
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  logger.debug({ msg: 'Total files unsynced', totalFilesUnsynced: manager.totalFilesUnsynced });
  return manager.totalFilesUnsynced;
});

export async function initSyncEngine({ context }: { context: AuthContext }) {
  try {
    const syncRoots = VirtualDrive.getRegisteredSyncRoots();
    const previousProviderIds = syncRoots.map((syncRoot) => syncRoot.id);

    const { providerId } = spawnDefaultSyncEngineWorker({ context, previousProviderIds });
    void spawnWorkspaceSyncEngineWorkers({ context, providerId, previousProviderIds });
    await debouncedSynchronization();
  } catch (error) {
    throw logger.error({
      msg: 'Error initializing remote sync managers',
      exc: error,
    });
  }
}

eventBus.on('USER_LOGGED_OUT', () => {
  remoteSyncManagers.clear();
});

function checkSyncInProgress({ workspaceId }: { workspaceId: string }) {
  const manager = getRemoteSyncManager({ workspaceId });
  if (!manager) throw new Error('RemoteSyncManager not found');

  const isSyncing = manager.status === 'SYNCING';
  return isSyncing;
}

ipcMain.handle('CHECK_SYNC_IN_PROGRESS', (_, workspaceId = '') => {
  return checkSyncInProgress({ workspaceId });
});

ipcMain.handle('get-item-by-folder-uuid', async (_, folderUuid): Promise<ItemBackup[]> => {
  logger.debug({ msg: 'Getting items by folder uuid', folderUuid });

  const abortController = new AbortController();

  const { folders } = await fetchItems({
    folderUuid,
    skipFiles: true,
    abortSignal: abortController.signal,
  });

  return folders.map((folder) => ({
    id: folder.id,
    uuid: folder.uuid,
    name: folder.plainName,
    plainName: folder.plainName,
    tmpPath: '',
    pathname: '',
    backupsBucket: folder.bucket || '',
  }));
});
