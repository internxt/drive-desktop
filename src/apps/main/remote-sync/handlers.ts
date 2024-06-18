import { ipcMain } from 'electron';
import Logger from 'electron-log';
import { reportError } from '../bug-report/service';
import eventBus from '../event-bus';
import { setInitialSyncState } from './InitialSyncReady';
import {
  getUpdatedRemoteItems,
  remoteSyncManager,
  resyncRemoteSync,
  startRemoteSync,
} from './service';
import { MainProcessSyncEngineIPC } from '../MainProcessSyncEngineIPC';

MainProcessSyncEngineIPC.handle('remote-sync-manager.refresh', async () => {
  await startRemoteSync();
});

ipcMain.handle('GET_UPDATED_REMOTE_ITEMS', async () => {
  Logger.debug('[MAIN] Getting updated remote items');
  return getUpdatedRemoteItems();
});

ipcMain.handle('START_REMOTE_SYNC', async () => {
  await startRemoteSync();
});

ipcMain.handle('get-remote-sync-status', () =>
  remoteSyncManager.getSyncStatus()
);

eventBus.on('RECEIVED_REMOTE_CHANGES', async () => {
  // Wait before checking for updates, could be possible
  // that we received the notification, but if we check
  // for new data we don't receive it
  await resyncRemoteSync();
});

eventBus.on('APP_DATA_SOURCE_INITIALIZED', async () => {
  await remoteSyncManager.startRemoteSync().catch((error) => {
    Logger.error('Error starting remote sync manager', error);
    reportError(error);
  });
});

eventBus.on('USER_LOGGED_OUT', () => {
  setInitialSyncState('NOT_READY');
  remoteSyncManager.resetRemoteSync();
});
