import eventBus from '../event-bus';
import { RemoteSyncManager } from './RemoteSyncManager';
import { DriveFilesCollection } from '../database/collections/DriveFileCollection';
import { DriveFoldersCollection } from '../database/collections/DriveFolderCollection';
import { clearRemoteSyncStore } from './helpers';
import { getNewTokenClient } from '../../shared/HttpClient/main-process-client';
import Logger from 'electron-log';
const remoteSyncManager = new RemoteSyncManager(
  {
    files: new DriveFilesCollection(),
    folders: new DriveFoldersCollection(),
  },
  {
    httpClient: getNewTokenClient(),
    fetchFilesLimitPerRequest: 50,
    fetchFoldersLimitPerRequest: 50,
    syncFiles: true,
    syncFolders: true,
  }
);
eventBus.on('USER_LOGGED_IN', () => {
  Logger.info('Received user logged in event, running RemoteSyncManager');
  remoteSyncManager.onStatusChange((newStatus) => {
    Logger.info(`RemoteSyncManager status: ${newStatus}`);
  });

  remoteSyncManager.startRemoteSync().catch((error) => {
    Logger.error('Error starting remote sync manager', error);
    reportError(error);
  });
});

eventBus.on('USER_LOGGED_OUT', () => {
  clearRemoteSyncStore();
});
