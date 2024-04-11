import eventBus from '../event-bus';
import { RemoteSyncManager } from './RemoteSyncManager';
import { DriveFilesCollection } from '../database/collections/DriveFileCollection';
import { DriveFoldersCollection } from '../database/collections/DriveFolderCollection';
import { clearRemoteSyncStore } from './helpers';
import { getNewTokenClient } from '../../shared/HttpClient/main-process-client';
import Logger from 'electron-log';
import { ipcMain } from 'electron';
import { reportError } from '../bug-report/service';
import { broadcastToWindows } from '../windows';
import { debounce } from 'lodash';
import { getUsageService } from '../usage/handlers';
import { sleep } from '../util';

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

export async function startRemoteSync(): Promise<void> {
  await remoteSyncManager.startRemoteSync();

  await checkIsFullySyncAndResync();
}

async function calculateLocalUsage() {
  return driveFilesCollection.calculateAllFilesWeight();
}

async function checkIsFullySyncAndResync(): Promise<void> {
  const service = getUsageService();

  const driveUsage = await service.getDriveUsage();
  const localCount = await calculateLocalUsage();

  if (driveUsage === localCount) {
    Logger.info('SIZES MATCH');
    return;
  }

  Logger.warn('REMOTE AND LOCAL USAGE DOES NOT MATCH WILL RETRY');
  Logger.info('Previous drive size: ', driveUsage);
  Logger.info('Previous local size: ', localCount);
  Logger.info('Previous files count', remoteSyncManager.getTotalFilesSynced());

  clearRemoteSyncStore();

  await sleep(5_000);

  await remoteSyncManager.startRemoteSync().catch((error) => {
    Logger.error('Error starting remote sync manager', error);
    reportError(error);
  });

  /*  
  const localNumberOfFiles = await driveFilesCollection.countFiles();
  const syncNumberOfFiles = remoteSyncManager.getTotalFilesSynced();
  Logger.info('Current local files: ', localNumberOfFiles);
  Logger.info('Current sync size: ', syncNumberOfFiles);

  return localNumberOfFiles === syncNumberOfFiles; */
}

ipcMain.handle('START_REMOTE_SYNC', async () => {
  await startRemoteSync();
});

remoteSyncManager.onStatusChange(async (newStatus) => {
  if (!initialSyncReady && newStatus === 'SYNCED') {
    initialSyncReady = true;
    await checkIsFullySyncAndResync();
    eventBus.emit('INITIAL_SYNC_READY');
  }
  broadcastToWindows('remote-sync-status-change', newStatus);
});

ipcMain.handle('get-remote-sync-status', () =>
  remoteSyncManager.getSyncStatus()
);
const debouncedSynchronization = debounce(async () => {
  await startRemoteSync();
  eventBus.emit('REMOTE_CHANGES_SYNCHED');
}, 3_000);

eventBus.on('RECEIVED_REMOTE_CHANGES', async () => {
  // Wait before checking for updates, could be possible
  // that we received the notification, but if we check
  // for new data we don't receive it
  await debouncedSynchronization();
});

eventBus.on('USER_LOGGED_IN', async () => {
  Logger.info('Received user logged in event');

  await remoteSyncManager.startRemoteSync().catch((error) => {
    Logger.error('Error starting remote sync manager', error);
    reportError(error);
  });

  await checkIsFullySyncAndResync();
});

eventBus.on('USER_LOGGED_OUT', () => {
  initialSyncReady = false;
  remoteSyncManager.resetRemoteSync();
  clearRemoteSyncStore();
});
