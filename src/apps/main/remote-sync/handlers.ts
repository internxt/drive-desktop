import eventBus from '../event-bus';
import { RemoteSyncManager } from './RemoteSyncManager';
import { DriveFilesCollection } from '../database/collections/DriveFileCollection';
import { DriveFoldersCollection } from '../database/collections/DriveFolderCollection';
import { RemoteSyncStatus } from './helpers';
import { getNewTokenClient } from '../../shared/HttpClient/main-process-client';
import Logger from 'electron-log';
import { ipcMain } from 'electron';
import { reportError } from '../bug-report/service';
import { sleep } from '../util';
import { broadcastToWindows } from '../windows';
import { updateSyncEngine, fallbackSyncEngine, sendUpdateFilesInSyncPending } from '../background-processes/sync-engine';
import { debounce } from 'lodash';
import configStore from '../config';
import { setTrayStatus } from '../tray/tray';
import { DriveFile } from '../database/entities/DriveFile';
import { DriveFolder } from '../database/entities/DriveFolder';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '../../../context/virtual-drive/folders/domain/FolderPlaceholderId';
import { ItemBackup } from '../../shared/types/items';
import { logger } from '../../shared/logger/logger';

const SYNC_DEBOUNCE_DELAY = 500;

let initialSyncReady = false;
const driveFilesCollection = new DriveFilesCollection();
const driveFoldersCollection = new DriveFoldersCollection();
const remoteSyncManager = new RemoteSyncManager(
  {
    files: driveFilesCollection,
    folders: driveFoldersCollection,
  },
  {
    httpClient: getNewTokenClient(),
    fetchFilesLimitPerRequest: 50,
    fetchFoldersLimitPerRequest: 50,
  },
);

export function setIsProcessing(isProcessing: boolean) {
  remoteSyncManager.isProcessRunning = isProcessing;
}

export function checkSyncEngineInProcess(milliSeconds: number) {
  const syncingStatus: RemoteSyncStatus = 'SYNCING';
  const isSyncing = remoteSyncManager.getSyncStatus() === syncingStatus;
  const recentlySyncing = remoteSyncManager.recentlyWasSyncing(milliSeconds);
  return isSyncing || recentlySyncing; // syncing or recently was syncing
}

export async function getUpdatedRemoteItems() {
  try {
    const [allDriveFiles, allDriveFolders] = await Promise.all([driveFilesCollection.getAll(), driveFoldersCollection.getAll()]);

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
export async function getUpdatedRemoteItemsByFolder(folderId: number) {
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
      driveFilesCollection.getAllByFolder(folderId),
      driveFoldersCollection.getAllByFolder(folderId),
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
        return getUpdatedRemoteItemsByFolder(folder.id);
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

ipcMain.handle('GET_UPDATED_REMOTE_ITEMS', async () => {
  Logger.debug('[MAIN] Getting updated remote items');
  return getUpdatedRemoteItems();
});
ipcMain.handle('GET_UPDATED_REMOTE_ITEMS_BY_FOLDER', async (_, folderId: number) => {
  Logger.debug('[MAIN] Getting updated remote items');
  return getUpdatedRemoteItemsByFolder(folderId);
});

export async function startRemoteSync(folderId?: number): Promise<void> {
  try {
    const { files, folders } = await remoteSyncManager.startRemoteSync(folderId);

    logger.info({ fn: 'startRemoteSync', folderId, folders: folders.length, files: files.length });

    if (folderId && folders.length > 0) {
      await Promise.all(
        folders.map(async (folder) => {
          if (!folder.id) return;
          await sleep(400);
          await startRemoteSync(folder.id);
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

ipcMain.handle('START_REMOTE_SYNC', async () => {
  Logger.info('Received start remote sync event');
  const isSyncing = await checkSyncEngineInProcess(5_000);
  if (isSyncing) {
    Logger.info('Remote sync is already running');
    return;
  }
  setIsProcessing(true);
  await startRemoteSync();
  setIsProcessing(false);
});

ipcMain.handle('FORCE_REFRESH_BACKUPS', async (_, folderId: number) => {
  await startRemoteSync(folderId);
});

remoteSyncManager.onStatusChange((newStatus) => {
  if (!initialSyncReady && newStatus === 'SYNCED') {
    initialSyncReady = true;
    eventBus.emit('INITIAL_SYNC_READY');
  }
  broadcastToWindows('remote-sync-status-change', newStatus);
});

remoteSyncManager.onStatusChange((newStatus) => {
  if (newStatus === 'SYNCING') {
    return setTrayStatus('SYNCING');
  }
  if (newStatus === 'SYNC_FAILED') {
    return setTrayStatus('ALERT');
  }
  setTrayStatus('IDLE');
});

ipcMain.handle('get-remote-sync-status', () => remoteSyncManager.getSyncStatus());

export async function updateRemoteSync(): Promise<void> {
  // Wait before checking for updates, could be possible
  // that we received the notification, but if we check
  // for new data we don't receive it
  Logger.info('Updating remote sync');

  const userData = configStore.get('userData');
  const lastFilesSyncAt = await remoteSyncManager.getFileCheckpoint();
  logger.info({ msg: 'Last files sync at', lastFilesSyncAt });
  const folderId = lastFilesSyncAt ? undefined : userData?.root_folder_id;
  await startRemoteSync(folderId);
  const isSyncing = await checkSyncEngineInProcess(5000);
  Logger.info('Is syncing', isSyncing);
  if (isSyncing) {
    Logger.info('Remote sync is already running');
    return;
  }
  updateSyncEngine();
}
export async function fallbackRemoteSync(): Promise<void> {
  Logger.info('Fallback remote sync');
  fallbackSyncEngine();
}

ipcMain.handle('SYNC_MANUALLY', async () => {
  Logger.info('[Manual Sync] Received manual sync event');
  const isSyncing = await checkSyncEngineInProcess(5000);
  if (isSyncing) return;
  await updateRemoteSync();
  await fallbackRemoteSync();
});

ipcMain.handle('GET_UNSYNC_FILE_IN_SYNC_ENGINE', async () => {
  Logger.info('[Get UnSync] Received Get UnSync File event');
  Logger.info(remoteSyncManager.getUnSyncFiles());
  return remoteSyncManager.getUnSyncFiles();
});

ipcMain.handle('SEND_UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE', async () => {
  Logger.info('[UPDATE UnSync] Received update UnSync File event');
  await sendUpdateFilesInSyncPending();
});

ipcMain.on('UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE', async (_: unknown, filesPath: string[]) => {
  Logger.info('[SYNC ENGINE] update unSync files', filesPath);
  remoteSyncManager.setUnsyncFiles(filesPath);
});

const debouncedSynchronization = debounce(async () => {
  await updateRemoteSync();
}, SYNC_DEBOUNCE_DELAY);

eventBus.on('RECEIVED_REMOTE_CHANGES', async () => {
  Logger.info('Received remote changes event');
  debouncedSynchronization();
});

eventBus.on('USER_LOGGED_IN', async () => {
  try {
    remoteSyncManager.isProcessRunning = true;
    setTrayStatus('SYNCING');
    const userData = configStore.get('userData');
    const lastFilesSyncAt = await remoteSyncManager.getFileCheckpoint();
    logger.info({ msg: 'Received user logged in event', lastFilesSyncAt });
    const folderId = lastFilesSyncAt ? undefined : userData?.root_folder_id;
    await startRemoteSync(folderId);
    eventBus.emit('INITIAL_SYNC_READY');
  } catch (error) {
    Logger.error('Error starting remote sync manager', error);
    if (error instanceof Error) reportError(error);
  }
});

eventBus.on('USER_LOGGED_OUT', () => {
  initialSyncReady = false;
  remoteSyncManager.resetRemoteSync();
});

ipcMain.on('CHECK_SYNC', (event) => {
  Logger.info('Checking sync');
  event.sender.send('CHECK_SYNC_ENGINE_RESPONSE', '');
});

ipcMain.on('CHECK_SYNC_CHANGE_STATUS', async (_, placeholderStates) => {
  Logger.info('[SYNC ENGINE] Changing status', placeholderStates);
  await sleep(5_000);
  remoteSyncManager.placeholderStatus = placeholderStates;
});

export async function checkSyncInProgress(milliSeconds: number) {
  const syncingStatus: RemoteSyncStatus = 'SYNCING';
  const isSyncing = remoteSyncManager.getSyncStatus() === syncingStatus;
  const recentlySyncing = remoteSyncManager.recentlyWasSyncing(milliSeconds);
  return isSyncing || recentlySyncing; // syncing or recently was syncing
}

ipcMain.handle('CHECK_SYNC_IN_PROGRESS', async (_, milliSeconds: number) => {
  return await checkSyncInProgress(milliSeconds);
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

ipcMain.handle('DELETE_ITEM_DRIVE', async (_, itemId: FilePlaceholderId | FolderPlaceholderId): Promise<boolean> => {
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

ipcMain.handle('get-item-by-folder-id', async (_, folderId): Promise<ItemBackup[]> => {
  Logger.info('Getting items by folder id', folderId);

  let offset = 0;
  let hasMore = true;
  const folders = [];

  do {
    const response = await remoteSyncManager.fetchFoldersByFolderFromRemote({
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
    tmpPath: '',
    pathname: '',
    backupsBucket: folder.bucket || '',
  }));
});
