import { In } from 'typeorm';
/* eslint-disable no-use-before-define */
import eventBus from '../event-bus';
import { RemoteSyncManager } from './RemoteSyncManager';
import Logger from 'electron-log';
import { ipcMain } from 'electron';
import { spawnAllSyncEngineWorker } from '../background-processes/sync-engine';
import { DriveFile } from '../database/entities/DriveFile';
import { DriveFolder } from '../database/entities/DriveFolder';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '../../../context/virtual-drive/folders/domain/FolderPlaceholderId';
import { ItemBackup } from '../../shared/types/items';
import { logger } from '../../shared/logger/logger';
import Queue from '@/apps/shared/Queue/Queue';
import { driveFilesCollection, driveFoldersCollection, getRemoteSyncManager, remoteSyncManagers } from './store';
import { startRemoteSync } from './services/start-remote-sync';
import { updateAllRemoteSync } from './services/update-remote-sync';

remoteSyncManagers.set('', new RemoteSyncManager());

export async function initializeRemoteSyncManager({ workspaceId }: { workspaceId: string }) {
  remoteSyncManagers.set(workspaceId, new RemoteSyncManager(workspaceId));
}

type UpdateFileInBatchInput = {
  itemsId: string[];
  file: Partial<DriveFile>;
};

export async function getLocalDangledFiles() {
  const allExisting = await driveFilesCollection.getAllWhere({ status: 'EXISTS', isDangledStatus: true });

  return allExisting.result;
}

export async function setAsNotDangledFiles(filesIds: string[]) {
  await driveFilesCollection.updateInBatch({
    where: { isDangledStatus: true, fileId: In(filesIds) },
    updatePayload: { isDangledStatus: false },
  });
}

export const updateFileInBatch = async (input: UpdateFileInBatchInput) => {
  const { itemsId, file } = input;

  await driveFilesCollection.updateInBatch({
    where: {
      fileId: In(itemsId),
    },
    updatePayload: file,
  });
};

export const deleteFileInBatch = async (itemsIds: string[]) => {
  await driveFilesCollection.removeInBatch({
    fileId: In(itemsIds),
  });
};

export function setSynced(workspaceId: string) {
  const manager = remoteSyncManagers.get(workspaceId);
  if (manager) manager.changeStatus('SYNCED');
}

export async function getUpdatedRemoteItems(workspaceId = '') {
  try {
    const promise = Promise.all([driveFilesCollection.getAll(workspaceId), driveFoldersCollection.getAll(workspaceId)]);

    const [allDriveFiles, allDriveFolders] = await promise;

    if (!allDriveFiles.success) throw new Error('Failed to retrieve all the drive files from local db');

    if (!allDriveFolders.success) throw new Error('Failed to retrieve all the drive folders from local db');
    return {
      files: allDriveFiles.result,
      folders: allDriveFolders.result,
    };
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
      driveFilesCollection.getAllByFolder({ folderUuid, workspaceId }),
      driveFoldersCollection.getAllByFolder({ parentUuid: folderUuid, workspaceId }),
    ]);

    if (!allDriveFiles.success) {
      throw new Error(`Failed to retrieve all the drive files from local db for folderUuid: ${folderUuid}`);
    }

    if (!allDriveFolders.success) {
      throw new Error(`Failed to retrieve all the drive folders from local db for folderUuid: ${folderUuid}`);
    }

    result.files.push(...allDriveFiles.result);
    result.folders.push(...allDriveFolders.result);

    if (allDriveFolders.result.length === 0) {
      return result;
    }

    const folderChildrenPromises = allDriveFolders.result.map(async (folder) => {
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

ipcMain.handle('FORCE_REFRESH_BACKUPS', async (_, folderUuid: string, workspaceId = '') => {
  await startRemoteSync({ folderUuid, workspaceId });
});

ipcMain.handle('get-remote-sync-status', (_, workspaceId = '') => {
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  return manager.status;
});

ipcMain.handle('SYNC_MANUALLY', async () => {
  Logger.info('[Manual Sync] Received manual sync event');
  await updateAllRemoteSync();
});

ipcMain.handle('GET_UNSYNC_FILE_IN_SYNC_ENGINE', async (_, workspaceId = '') => {
  Logger.info('[Get UnSync] Received Get UnSync File event');
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  Logger.info(manager.totalFilesUnsynced);
  return manager.totalFilesUnsynced;
});

ipcMain.on('UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE', async (_: unknown, filesPath: string[], workspaceId = '') => {
  Logger.info('[SYNC ENGINE] update unSync files', filesPath);
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  manager.totalFilesUnsynced = filesPath;
});

export async function initSyncEngine() {
  try {
    await spawnAllSyncEngineWorker();
    await updateAllRemoteSync();
  } catch (error) {
    throw logger.error({
      msg: 'Error initializing remote sync managers',
      exc: error,
    });
  }
}

eventBus.on('USER_LOGGED_OUT', () => {
  remoteSyncManagers.forEach((manager) => {
    manager.resetRemoteSync();
  });
});

export function checkSyncInProgress(workspaceId: string) {
  const manager = getRemoteSyncManager({ workspaceId });
  if (!manager) return false;
  return manager.status === 'SYNCING';
}

ipcMain.handle('CHECK_SYNC_IN_PROGRESS', (_, workspaceId: string) => {
  return checkSyncInProgress(workspaceId);
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
    const item = await driveFilesCollection.searchPartialBy({ fileId });
    if (!item.result.length) {
      Logger.warn('File not found', { fileId });
      return false;
    }
    const result = await driveFilesCollection.update(item.result[0].uuid, {
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
