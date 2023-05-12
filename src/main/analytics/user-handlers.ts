import { ipcMain } from 'electron';

import eventBus from '../event-bus';
import { userLogout, userSignin, userSigninFailed } from './service';
import { RemoteSyncManager } from '../remote-sync/RemoteSyncManager';
import { DriveFilesDB } from '../database/collections/driveFilesCollection';
import { DriveFoldersDB } from '../database/collections/driveFoldersCollection';
import Logger from 'electron-log';
import { clearRemoteSyncStore } from '../remote-sync/helpers';
import { reportError } from '../bug-report/service';

eventBus.on('USER_LOGGED_IN', () => {
  userSignin();
  const remoteSyncManager = new RemoteSyncManager(
    {
      files: new DriveFilesDB(),
      folders: new DriveFoldersDB(),
    },
    {
      fetchFilesLimitPerRequest: 50,
      fetchFoldersLimitPerRequest: 50,
      syncFiles: true,
      syncFolders: true,
    }
  );

  remoteSyncManager.onStatusChange((newStatus) => {
    Logger.info(`RemoteSyncManager status: ${newStatus}`);
  });

  remoteSyncManager.startRemoteSync().catch((error) => {
    Logger.error('Error starting remote sync manager', error);
    reportError(error);
  });
});

eventBus.on('USER_LOGGED_OUT', () => {
  userLogout();
  clearRemoteSyncStore();
});

ipcMain.on('USER_LOGIN_FAILED', (_, email: string) => {
  userSigninFailed(email);
});
