import { In } from 'typeorm';
/* eslint-disable no-use-before-define */
import eventBus from '../event-bus';
import { RemoteSyncManager } from './RemoteSyncManager';
import Logger from 'electron-log';
import { ipcMain } from 'electron';
import { spawnAllSyncEngineWorker, updateSyncEngine } from '../background-processes/sync-engine';
import lodashDebounce from 'lodash.debounce';
import { DriveFile } from '../database/entities/DriveFile';
import { DriveFolder } from '../database/entities/DriveFolder';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '../../../context/virtual-drive/folders/domain/FolderPlaceholderId';
import { ItemBackup } from '../../shared/types/items';
import { logger } from '../../shared/logger/logger';
import Queue from '@/apps/shared/Queue/Queue';
import { driveFilesCollection, driveFoldersCollection, getRemoteSyncManager, remoteSyncManagers } from './store';
import { TWorkerConfig } from '../background-processes/sync-engine/store';
import { getSyncStatus } from './services/broadcast-sync-status';

export function addRemoteSyncManager({ workspaceId, worker }: { workspaceId?: string; worker: TWorkerConfig }) {
  remoteSyncManagers.set(workspaceId ?? '', new RemoteSyncManager(worker, workspaceId));
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

export async function getUpdatedRemoteItems(workspaceId = '') {
  try {
    const promise = Promise.all([driveFilesCollection.getAll({ workspaceId }), driveFoldersCollection.getAll({ workspaceId })]);

    const [files, folders] = await promise;

    return { files, folders };
  } catch (error) {
    throw logger.error({
      msg: 'Error getting updated remote items',
      exc: error,
    });
  }
}

export async function getUpdatedRemoteItemsByFolder(folderUuid: string, workspaceId = '') {
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  if (!folderUuid) {
    throw new Error('Invalid folderUuid provided');
  }

  try {
    const result: {
      files: DriveFile[];
      folders: DriveFolder[];
    } = {
      files: [],
      folders: [],
    };

    const [allDriveFiles, allDriveFolders] = await Promise.all([
      driveFilesCollection.getAll({ folderUuid, workspaceId }),
      driveFoldersCollection.getAll({ parentUuid: folderUuid, workspaceId }),
    ]);

    result.files.push(...allDriveFiles);
    result.folders.push(...allDriveFolders);

    if (allDriveFolders.length === 0) {
      return result;
    }

    const folderChildrenPromises = allDriveFolders.map(async (folder) => {
      return getUpdatedRemoteItemsByFolder(folder.uuid, workspaceId);
    });

    const folderChildrenResults = await Promise.all(folderChildrenPromises);

    for (const folderChildren of folderChildrenResults) {
      if (folderChildren) {
        result.files.push(...folderChildren.files);
        result.folders.push(...folderChildren.folders);
      }
    }

    return result;
  } catch (error) {
    throw logger.error({
      msg: 'Error getting updated remote items by folder',
      exc: error,
    });
  }
}

ipcMain.handle('FIND_DANGLED_FILES', async () => {
  return await getLocalDangledFiles();
});

ipcMain.handle('SET_HEALTHY_FILES', async (_, inputData) => {
  Queue.enqueue(() => setAsNotDangledFiles(inputData));
});

ipcMain.handle('UPDATE_FIXED_FILES', async (_, inputData) => {
  Logger.info('Updating fixed files', inputData);
  await updateFileInBatch({ itemsId: inputData.toUpdate, file: { isDangledStatus: false } });
  await deleteFileInBatch(inputData.toDelete);
  return;
});

ipcMain.handle('GET_UPDATED_REMOTE_ITEMS', async (_, workspaceId = '') => {
  Logger.debug('[MAIN] Getting updated remote file items ' + workspaceId);
  return getUpdatedRemoteItems(workspaceId);
});

ipcMain.handle('GET_UPDATED_REMOTE_ITEMS_BY_FOLDER', async (_, folderUuid: string, workspaceId = '') => {
  Logger.debug('[MAIN] Getting updated remote items');
  return getUpdatedRemoteItemsByFolder(folderUuid, workspaceId);
});

async function updateRemoteSync({ workspaceId }: { workspaceId: string }) {
  const manager = getRemoteSyncManager({ workspaceId });
  if (!manager) return;

  const isSyncing = checkSyncInProgress({ workspaceId });

  if (isSyncing) {
    logger.debug({ msg: 'Remote sync is already running', workspaceId });
    return;
  }

  manager.changeStatus('SYNCING');
  await startRemoteSync({ workspaceId });
  updateSyncEngine(workspaceId);
}

async function updateAllRemoteSync() {
  await Promise.all(
    [...remoteSyncManagers].map(async ([workspaceId]) => {
      await updateRemoteSync({ workspaceId });
    }),
  );
}

export const debouncedSynchronization = lodashDebounce(updateAllRemoteSync, 5000);

async function startRemoteSync({ folderUuid, workspaceId }: { folderUuid?: string; workspaceId: string }): Promise<void> {
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');

  try {
    const { files, folders } = await manager.startRemoteSync(folderUuid);

    logger.debug({
      msg: 'Remote sync finished',
      workspaceId,
      folderUuid,
      folders: folders.length,
      files: files.length,
    });

    if (folderUuid && folders.length > 0) {
      await Promise.all(
        folders.map(async (folder) => {
          await startRemoteSync({
            folderUuid: folder.uuid,
            workspaceId,
          });
        }),
      );
    }
  } catch (error) {
    throw logger.error({
      msg: 'Error starting remote sync',
      exc: error,
    });
  }
}

ipcMain.handle('FORCE_REFRESH_BACKUPS', async (_, folderUuid: string, workspaceId = '') => {
  await startRemoteSync({ folderUuid, workspaceId });
});

ipcMain.handle('get-remote-sync-status', () => {
  return getSyncStatus();
});

ipcMain.handle('SYNC_MANUALLY', async () => {
  Logger.info('[Manual Sync] Received manual sync event');
  await debouncedSynchronization();
});

ipcMain.handle('GET_UNSYNC_FILE_IN_SYNC_ENGINE', async (_, workspaceId = '') => {
  Logger.info('[Get UnSync] Received Get UnSync File event');
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  Logger.info(manager.getUnSyncFiles());
  return manager.getUnSyncFiles();
});

export async function initSyncEngine() {
  try {
    await spawnAllSyncEngineWorker();
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

  const isSyncing = manager.getSyncStatus() === 'SYNCING';
  return isSyncing;
}

ipcMain.handle('CHECK_SYNC_IN_PROGRESS', (_, workspaceId = '') => {
  return checkSyncInProgress({ workspaceId });
});

function parseItemId(itemId: string) {
  const [type, id] = itemId
    .replace(
      // eslint-disable-next-line no-control-regex
      /[\x00-\x1F\x7F-\x9F]/g,
      '',
    )
    .normalize()
    .split(':');
  if (!type || !id) {
    throw new Error(`Invalid itemId format: ${itemId}`);
  }
  return { type, id };
}

async function deleteFolder(folderId: string): Promise<boolean> {
  try {
    const result = await driveFoldersCollection.update(folderId, {
      status: 'TRASHED',
    });
    return result.success;
  } catch (error) {
    Logger.error('Error deleting folder', { folderId, error });
    throw error;
  }
}

async function deleteFile(fileId: string): Promise<boolean> {
  try {
    const item = await driveFilesCollection.getByContentsId(fileId);
    if (!item) {
      Logger.warn('File not found', { fileId });
      return false;
    }
    const result = await driveFilesCollection.update(item.uuid, {
      status: 'TRASHED',
    });
    return result.success;
  } catch (error) {
    Logger.error('Error deleting file', { fileId, error });
    throw error;
  }
}

ipcMain.handle('DELETE_ITEM_DRIVE', async (_, itemId: FilePlaceholderId | FolderPlaceholderId, workspaceId = ''): Promise<boolean> => {
  try {
    const { type, id } = parseItemId(itemId);
    Logger.info('Deleting item in handler', { type, id });

    const isFolder = type === 'FOLDER';
    const result = isFolder ? await deleteFolder(id) : await deleteFile(id);

    return result;
  } catch (error) {
    Logger.error('Error deleting item in handler', { error });
    return false;
  }
});

ipcMain.handle('get-item-by-folder-uuid', async (_, folderUuid, workspaceId = ''): Promise<ItemBackup[]> => {
  Logger.info('Getting items by folder uuid', folderUuid);

  let offset = 0;
  let hasMore = true;
  const folders = [];

  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');

  do {
    const response = await manager.fetchFoldersByFolderFromRemote({
      offset,
      folderUuid,
      updatedAtCheckpoint: new Date(),
      status: 'EXISTS',
    });

    hasMore = response.hasMore;
    offset += response.result.length;
    folders.push(...response.result);
  } while (hasMore);

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
