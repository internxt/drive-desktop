import { debounce } from 'lodash';
import eventBus from '../event-bus';
import { getNewTokenClient } from '../../shared/HttpClient/main-process-client';
import { DriveFilesCollection } from '../database/collections/DriveFileCollection';
import { DriveFoldersCollection } from '../database/collections/DriveFolderCollection';
import { RemoteSyncManager } from './RemoteSyncManager';
import { broadcastToWindows } from '../windows';
import { isInitialSyncReady, setInitialSyncState } from './InitialSyncReady';
import { RemoteSyncErrorHandler } from './RemoteSyncErrorHandler/RemoteSyncErrorHandler';

const SYNC_DEBOUNCE_DELAY = 3_000;

const driveFilesCollection = new DriveFilesCollection();
const driveFoldersCollection = new DriveFoldersCollection();
const errorHandler = new RemoteSyncErrorHandler();

export const remoteSyncManager = new RemoteSyncManager(
  {
    files: driveFilesCollection,
    folders: driveFoldersCollection,
  },
  {
    httpClient: getNewTokenClient(),
    fetchFilesLimitPerRequest: 1000,
    fetchFoldersLimitPerRequest: 1000,
    syncFiles: true,
    syncFolders: true,
  },
  errorHandler,
);

remoteSyncManager.onStatusChange(async (newStatus) => {
  if (!isInitialSyncReady() && newStatus === 'SYNCED') {
    setInitialSyncState('READY');
    eventBus.emit('INITIAL_SYNC_READY');
  }
  broadcastToWindows('remote-sync-status-change', newStatus);
});

export async function getUpdatedRemoteItems() {
  const [allDriveFiles, allDriveFolders] = await Promise.all([
    driveFilesCollection.getAll(),
    driveFoldersCollection.getAll(),
  ]);

  if (!allDriveFiles.success) throw new Error('Failed to retrieve all the drive files from local db');

  if (!allDriveFolders.success) throw new Error('Failed to retrieve all the drive folders from local db');
  return {
    files: allDriveFiles.result,
    folders: allDriveFolders.result,
  };
}

export async function startRemoteSync(): Promise<void> {
  await remoteSyncManager.startRemoteSync();
}

const debouncedSynchronization = debounce(async () => {
  await startRemoteSync();
  eventBus.emit('REMOTE_CHANGES_SYNCHED');
}, SYNC_DEBOUNCE_DELAY);

export async function resyncRemoteSync() {
  await debouncedSynchronization();
}

export async function getExistingFiles() {
  const allExisting = await driveFilesCollection.getAllWhere({
    status: 'EXISTS',
  });

  return allExisting.result;
}
