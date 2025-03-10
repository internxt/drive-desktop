import eventBus from '../event-bus';
import { RemoteSyncManager } from './RemoteSyncManager';
import { DriveFilesCollection } from '../database/collections/DriveFileCollection';
import { DriveFoldersCollection } from '../database/collections/DriveFolderCollection';
import { RemoteSyncStatus } from './helpers';
import Logger from 'electron-log';
import { ipcMain } from 'electron';
import { reportError } from '../bug-report/service';
import { sleep } from '../util';
import { broadcastToWindows } from '../windows';
import { updateSyncEngine, fallbackSyncEngine, sendUpdateFilesInSyncPending } from '../background-processes/sync-engine';
import lodashDebounce from 'lodash.debounce';
import { setTrayStatus } from '../tray/tray';
import { DriveFile } from '../database/entities/DriveFile';
import { DriveFolder } from '../database/entities/DriveFolder';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '../../../context/virtual-drive/folders/domain/FolderPlaceholderId';
import { ItemBackup } from '../../shared/types/items';
import { logger } from '../../shared/logger/logger';
import { DriveWorkspaceCollection } from '../database/collections/DriveWorkspaceCollection';
import { SyncRemoteWorkspaceService } from './workspace/sync-remote-workspace';

const SYNC_DEBOUNCE_DELAY = 500;

let initialSyncReady = false;
const driveFilesCollection = new DriveFilesCollection();
const driveFoldersCollection = new DriveFoldersCollection();
const driveWorkspaceCollection = new DriveWorkspaceCollection();
const remoteSyncManagers = new Map<string, RemoteSyncManager>();
export const syncWorkspaceService = new SyncRemoteWorkspaceService(driveWorkspaceCollection, driveFoldersCollection);
remoteSyncManagers.set(
  '',
  new RemoteSyncManager(
    {
      files: driveFilesCollection,
      folders: driveFoldersCollection,
    },
    {
      fetchFilesLimitPerRequest: 50,
      fetchFoldersLimitPerRequest: 50,
    },
  ),
);
async function initializeRemoteSyncManagers() {
  const workspaces = await syncWorkspaceService.run();
  workspaces.forEach((workspace) => {
    remoteSyncManagers.set(
      workspace.id,
      new RemoteSyncManager(
        {
          files: driveFilesCollection,
          folders: driveFoldersCollection,
        },
        {
          fetchFilesLimitPerRequest: 50,
          fetchFoldersLimitPerRequest: 50,
        },
        workspace.id,
      ),
    );
  });
}

export function setIsProcessing(isProcessing: boolean, workspaceId = '') {
  const manager = remoteSyncManagers.get(workspaceId);
  if (manager) {
    manager.isProcessRunning = isProcessing;
  }
}

export function checkSyncEngineInProcess(milliSeconds: number, workspaceId = '') {
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) return false;
  const syncingStatus: RemoteSyncStatus = 'SYNCING';
  const isSyncing = manager.getSyncStatus() === syncingStatus;
  const recentlySyncing = manager.recentlyWasSyncing(milliSeconds);
  return isSyncing || recentlySyncing; // syncing or recently was syncing
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
    reportError(error as Error, {
      description: 'Something failed when updating the local db pulling the new changes from remote',
    });
    throw error;
  }
}

export async function getUpdatedRemoteItemsByFolder(folderId: number, workspaceId = '') {
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  if (!folderId) {
    throw new Error('Invalid folderId provided');
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
      driveFilesCollection.getAllByFolder(folderId, workspaceId),
      driveFoldersCollection.getAllByFolder(folderId, workspaceId),
    ]);

    if (!allDriveFiles.success) {
      throw new Error(`Failed to retrieve all the drive files from local db for folderId: ${folderId}`);
    }

    if (!allDriveFolders.success) {
      throw new Error(`Failed to retrieve all the drive folders from local db for folderId: ${folderId}`);
    }

    result.files.push(...allDriveFiles.result);
    result.folders.push(...allDriveFolders.result);

    if (allDriveFolders.result.length === 0) {
      return result;
    }

    const folderChildrenPromises = allDriveFolders.result.map(async (folder) => {
      if (folder.id) {
        return getUpdatedRemoteItemsByFolder(folder.id, workspaceId);
      }
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
    if (error instanceof Error) {
      reportError(error, {
        description: 'Something failed when updating the local db pulling the new changes from remote',
      });
      throw error;
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

ipcMain.handle('GET_UPDATED_REMOTE_ITEMS', async (_, workspaceId = '') => {
  Logger.debug('[MAIN] Getting updated remote file items ' + workspaceId);
  return getUpdatedRemoteItems(workspaceId);
});

ipcMain.handle('GET_UPDATED_REMOTE_ITEMS_BY_FOLDER', async (_, folderId: number, workspaceId = '') => {
  Logger.debug('[MAIN] Getting updated remote items');
  return getUpdatedRemoteItemsByFolder(folderId, workspaceId);
});

async function populateAllRemoteSync(): Promise<void> {
  try {
    await Promise.all(
      Array.from(remoteSyncManagers.entries()).map(async ([workspaceId, manager]) => {
        await startRemoteSync(undefined, workspaceId);
      }),
    );
  } catch (error) {
    Logger.error('Error populating all remote sync', error);
    if (error instanceof Error) reportError(error);
  }
}

async function startRemoteSync(folderId?: number, workspaceId = ''): Promise<void> {
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  try {
    const { files, folders } = await manager.startRemoteSync(folderId);

    logger.info({ msg: 'startRemoteSync', folderId, folders: folders.length, files: files.length });

    if (folderId && folders.length > 0) {
      await Promise.all(
        folders.map(async (folder) => {
          if (!folder.id) return;
          await sleep(400);
          await startRemoteSync(folder.id, workspaceId);
        }),
      );
    }
    Logger.info('Remote sync finished');
  } catch (error) {
    if (error instanceof Error) {
      Logger.error('Error during remote sync', error);
      reportError(error);
    }
  }
}

ipcMain.handle('START_REMOTE_SYNC', async (_, workspaceId = '') => {
  Logger.info('Received start remote sync event');
  const isSyncing = await checkSyncEngineInProcess(5_000, workspaceId);
  if (isSyncing) {
    Logger.info('Remote sync is already running');
    return;
  }
  setIsProcessing(true, workspaceId);
  await startRemoteSync(undefined, workspaceId);
  setIsProcessing(false, workspaceId);
});

ipcMain.handle('FORCE_REFRESH_BACKUPS', async (_, folderId: number, workspaceId = '') => {
  await startRemoteSync(folderId, workspaceId);
});

remoteSyncManagers.forEach((manager) => {
  manager.onStatusChange((newStatus) => {
    if (!initialSyncReady && newStatus === 'SYNCED') {
      initialSyncReady = true;
      // eventBus.emit('INITIAL_SYNC_READY');
    }
    broadcastToWindows('remote-sync-status-change', newStatus);
  });

  manager.onStatusChange((newStatus) => {
    if (newStatus === 'SYNCING') {
      return setTrayStatus('SYNCING');
    }
    if (newStatus === 'SYNC_FAILED') {
      return setTrayStatus('ALERT');
    }
    setTrayStatus('IDLE');
  });
});

ipcMain.handle('get-remote-sync-status', (_, workspaceId = '') => {
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  return manager.getSyncStatus();
});

export async function updateRemoteSync(): Promise<void> {
  remoteSyncManagers.forEach(async (manager, workspaceId) => {
    await startRemoteSync(undefined, workspaceId);
    const isSyncing = checkSyncEngineInProcess(5000, workspaceId);
    Logger.info('Is syncing', isSyncing);
    if (isSyncing) {
      Logger.info('Remote sync is already running');
      return;
    }
    updateSyncEngine(workspaceId);
  });
}

export async function fallbackRemoteSync(workspaceId = ''): Promise<void> {
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  Logger.info('Fallback remote sync');
  fallbackSyncEngine(workspaceId);
}

ipcMain.handle('SYNC_MANUALLY', async (_, workspaceId = '') => {
  Logger.info('[Manual Sync] Received manual sync event');
  const isSyncing = await checkSyncEngineInProcess(5000, workspaceId);
  if (isSyncing) return;
  await updateRemoteSync();
  await fallbackRemoteSync(workspaceId);
});

ipcMain.handle('GET_UNSYNC_FILE_IN_SYNC_ENGINE', async (_, workspaceId = '') => {
  Logger.info('[Get UnSync] Received Get UnSync File event');
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  Logger.info(manager.getUnSyncFiles());
  return manager.getUnSyncFiles();
});

ipcMain.handle('SEND_UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE', async (_, workspaceId = '') => {
  Logger.info('[UPDATE UnSync] Received update UnSync File event');
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  await sendUpdateFilesInSyncPending(workspaceId);
});

ipcMain.on('UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE', async (_: unknown, filesPath: string[], workspaceId = '') => {
  Logger.info('[SYNC ENGINE] update unSync files', filesPath);
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  manager.setUnsyncFiles(filesPath);
});

const debouncedSynchronization = lodashDebounce(async () => {
  await updateRemoteSync();
}, SYNC_DEBOUNCE_DELAY);

eventBus.on('RECEIVED_REMOTE_CHANGES', async () => {
  Logger.info('Received remote changes event');
  debouncedSynchronization();
});

eventBus.on('USER_LOGGED_IN', async () => {
  try {
    await initializeRemoteSyncManagers();
    remoteSyncManagers.forEach((manager) => {
      manager.isProcessRunning = true;
    });
    await populateAllRemoteSync();

    eventBus.emit('INITIAL_SYNC_READY');
  } catch (error) {
    Logger.error('Error starting remote sync manager', error);
    if (error instanceof Error) reportError(error);
  }
});

eventBus.on('USER_LOGGED_OUT', () => {
  initialSyncReady = false;
  remoteSyncManagers.forEach((manager) => {
    manager.resetRemoteSync();
  });
});

ipcMain.on('CHECK_SYNC', (event) => {
  Logger.info('Checking sync');
  event.sender.send('CHECK_SYNC_ENGINE_RESPONSE', '');
});

ipcMain.on('CHECK_SYNC_CHANGE_STATUS', async (_, placeholderStates, workspaceId = '') => {
  Logger.info('[SYNC ENGINE] Changing status', placeholderStates);
  await sleep(5_000);
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  manager.placeholderStatus = placeholderStates;
});

export async function checkSyncInProgress(milliSeconds: number, workspaceId = '') {
  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');
  const syncingStatus: RemoteSyncStatus = 'SYNCING';
  const isSyncing = manager.getSyncStatus() === syncingStatus;
  const recentlySyncing = manager.recentlyWasSyncing(milliSeconds);
  return isSyncing || recentlySyncing; // syncing or recently was syncing
}

ipcMain.handle('CHECK_SYNC_IN_PROGRESS', async (_, milliSeconds: number, workspaceId = '') => {
  return await checkSyncInProgress(milliSeconds, workspaceId);
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

ipcMain.handle('get-item-by-folder-id', async (_, folderId, workspaceId = ''): Promise<ItemBackup[]> => {
  Logger.info('Getting items by folder id', folderId);

  let offset = 0;
  let hasMore = true;
  const folders = [];

  const manager = remoteSyncManagers.get(workspaceId);
  if (!manager) throw new Error('RemoteSyncManager not found');

  do {
    const response = await manager.fetchFoldersByFolderFromRemote({
      offset,
      folderId,
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
