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
import {
  updateSyncEngine,
  fallbackSyncEngine,
  sendUpdateFilesInSyncPending,
} from '../background-processes/sync-engine';
import { debounce } from 'lodash';
import configStore from '../config';
import { setTrayStatus } from '../tray/tray';

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
    syncFiles: true,
    syncFolders: true,
  }
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
    const [allDriveFiles, allDriveFolders] = await Promise.all([
      driveFilesCollection.getAll(),
      driveFoldersCollection.getAll(),
    ]);

    if (!allDriveFiles.success)
      throw new Error('Failed to retrieve all the drive files from local db');

    if (!allDriveFolders.success)
      throw new Error('Failed to retrieve all the drive folders from local db');
    return {
      files: allDriveFiles.result,
      folders: allDriveFolders.result,
    };
  } catch (error) {
    reportError(error as Error, {
      description:
        'Something failed when updating the local db pulling the new changes from remote',
    });
    throw error;
  }
}

ipcMain.handle('GET_UPDATED_REMOTE_ITEMS', async () => {
  Logger.debug('[MAIN] Getting updated remote items');
  return getUpdatedRemoteItems();
});

export async function startRemoteSync(folderId?: number): Promise<void> {
  try {
    Logger.info('Starting remote sync function');
    Logger.info('Folder id', folderId);

    const { files, folders } = await remoteSyncManager.startRemoteSync(
      folderId
    );
    Logger.info('Remote sync started', folders?.length, 'folders');
    Logger.info('Remote sync started', files?.length, 'files');

    if (folderId && folders && folders.length > 0) {
      await Promise.all(
        folders.map(async (folder) => {
          if (!folder.id) return;
          await sleep(400);
          await startRemoteSync(folder.id);
        })
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

ipcMain.handle('get-remote-sync-status', () =>
  remoteSyncManager.getSyncStatus()
);

export async function updateRemoteSync(): Promise<void> {
  // Wait before checking for updates, could be possible
  // that we received the notification, but if we check
  // for new data we don't receive it
  Logger.info('Updating remote sync');
  const isSyncing = await checkSyncEngineInProcess(2_000);
  if (isSyncing) {
    Logger.info('Remote sync is already running');
    return;
  }
  const userData = configStore.get('userData');
  const lastFilesSyncAt = await remoteSyncManager.getFileCheckpoint();
  Logger.info('Last files sync at', lastFilesSyncAt);
  const folderId = lastFilesSyncAt ? undefined : userData?.root_folder_id;
  await startRemoteSync(folderId);
  updateSyncEngine();
}
export async function fallbackRemoteSync(): Promise<void> {
  Logger.info('Fallback remote sync');
  fallbackSyncEngine();
}

ipcMain.handle('SYNC_MANUALLY', async () => {
  Logger.info('[Manual Sync] Received manual sync event');
  const isSyncing = await checkSyncEngineInProcess(5_000);
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

ipcMain.on(
  'UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE',
  async (_: unknown, filesPath: string[]) => {
    Logger.info('[SYNC ENGINE] update unSync files', filesPath);
    remoteSyncManager.setUnsyncFiles(filesPath);
  }
);

const debouncedSynchronization = debounce(async () => {
  await updateRemoteSync();
}, SYNC_DEBOUNCE_DELAY);

eventBus.on('RECEIVED_REMOTE_CHANGES', async () => {
  Logger.info('Received remote changes event');
  debouncedSynchronization();
});

eventBus.on('USER_LOGGED_IN', async () => {
  Logger.info('Received user logged in event');
  try {
    remoteSyncManager.isProcessRunning = true;
    const userData = configStore.get('userData');
    const lastFilesSyncAt = await remoteSyncManager.getFileCheckpoint();
    Logger.info('Last files sync at', lastFilesSyncAt);
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
