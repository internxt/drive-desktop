import { ipcMain, powerSaveBlocker, app, BrowserWindow } from 'electron';
import path from 'path';
import Logger from 'electron-log';
import * as uuid from 'uuid';
import { SyncArgs } from '../../workers/sync';
import {
  ProcessFatalErrorName,
  ProcessInfoUpdatePayload,
} from '../../workers/types';
import { getIsLoggedIn } from '../auth/handlers';
import * as Auth from '../auth/service';
import configStore from '../config';
import locksService from './locks-service';
import { getTray } from '../tray';
import { broadcastToWindows } from '../windows';
import { clearSyncIssues, getProcessIssues } from './process-issues';
import { ProcessResult } from '../../workers/process';

export type SyncStatus = 'STANDBY' | 'RUNNING';

let syncStatus = 'STANDBY';
let syncProcessRerun: null | ReturnType<typeof setTimeout> = null;
export const SYNC_INTERVAL = 10 * 60 * 1000;

ipcMain.on('start-sync-process', startSyncProcess);
ipcMain.handle('get-sync-status', () => syncStatus);

export function clearSyncTimeout() {
  if (syncProcessRerun) clearTimeout(syncProcessRerun);
}

export function scheduleSync(milliseconds: number) {
  syncProcessRerun = setTimeout(startSyncProcess, milliseconds);
}

export function setTraySyncStatus(newStatus: SyncStatus) {
  const tray = getTray();
  if (newStatus === 'RUNNING') {
    tray?.setState('SYNCING');
  } else if (getProcessIssues().length !== 0) {
    tray?.setState('ISSUES');
  } else {
    tray?.setState('STANDBY');
  }
}

function changeSyncStatus(newStatus: SyncStatus) {
  syncStatus = newStatus;
  broadcastToWindows('sync-status-changed', newStatus);
  setTraySyncStatus(newStatus);
}

export async function startSyncProcess() {
  if (syncStatus === 'RUNNING') {
    return;
  }

  const suspensionBlockId = powerSaveBlocker.start('prevent-app-suspension');

  changeSyncStatus('RUNNING');

  clearSyncIssues();

  // It's an object to pass it to
  // the individual item processors
  const hasBeenStopped = { value: false };

  ipcMain.once('stop-sync-process', () => {
    hasBeenStopped.value = true;
  });

  const item = {
    folderId: Auth.getUser()?.root_folder_id as number,
    localPath: configStore.get('syncRoot'),
    tmpPath: app.getPath('temp'),
  };
  await processSyncItem(item, hasBeenStopped);

  const currentTimestamp = new Date().valueOf();

  configStore.set('lastSync', currentTimestamp);

  clearSyncTimeout();

  if (getIsLoggedIn()) scheduleSync(SYNC_INTERVAL);

  changeSyncStatus('STANDBY');

  ipcMain.removeAllListeners('stop-sync-process');

  powerSaveBlocker.stop(suspensionBlockId);
}

export type SyncStoppedPayload =
  | { reason: 'STOPPED_BY_USER' | 'COULD_NOT_ACQUIRE_LOCK' }
  | {
      reason: 'FATAL_ERROR';
      errorName: ProcessFatalErrorName;
    }
  | { reason: 'EXIT'; result: ProcessResult };

function processSyncItem(item: SyncArgs, hasBeenStopped: { value: boolean }) {
  return new Promise<void>(async (resolve) => {
    const onExitFuncs: (() => void)[] = [];

    function onExit(payload: SyncStoppedPayload) {
      Logger.log(
        `[onSyncExit] (${payload.reason}) ${
          payload.reason === 'FATAL_ERROR' ? payload.errorName : ''
        } ${payload.reason === 'EXIT' ? payload.result.status : ''}`
      );
      onExitFuncs.forEach((f) => f());
      broadcastToWindows('sync-stopped', payload);

      resolve();
    }

    function onAcquireLockError(err: any) {
      Logger.log('Could not acquire lock', err);
      onExit({ reason: 'COULD_NOT_ACQUIRE_LOCK' });
    }

    try {
      const lockId = uuid.v4();
      await locksService.acquireLock(item.folderId, lockId);
      onExitFuncs.push(() => locksService.releaseLock(item.folderId, lockId));

      const lockRefreshInterval = setInterval(() => {
        locksService
          .refreshLock(item.folderId, lockId)
          .catch(() => {
            // If we fail to refresh the lock
            // we try to acquire it again
            // before stopping everything
            return locksService.acquireLock(item.folderId, lockId);
          })
          .catch(onAcquireLockError);
      }, 7000);
      onExitFuncs.push(() => clearInterval(lockRefreshInterval));

      // So the interval is cleared before the lock is released
      onExitFuncs.reverse();
    } catch (err) {
      return onAcquireLockError(err);
    }

    if (hasBeenStopped.value) {
      return onExit({ reason: 'STOPPED_BY_USER' });
    }

    ipcMain.handle('get-sync-details', () => item);
    onExitFuncs.push(() => ipcMain.removeHandler('get-sync-details'));

    ipcMain.once('SYNC_FATAL_ERROR', (_, errorName) =>
      onExit({ reason: 'FATAL_ERROR', errorName })
    );
    onExitFuncs.push(() => ipcMain.removeAllListeners('SYNC_FATAL_ERROR'));

    ipcMain.once('SYNC_EXIT', (_, result) =>
      onExit({ reason: 'EXIT', result })
    );
    onExitFuncs.push(() => ipcMain.removeAllListeners('SYNC_EXIT'));

    const worker = spawnSyncWorker();
    onExitFuncs.push(() => worker.destroy());

    if (hasBeenStopped.value) {
      return onExit({ reason: 'STOPPED_BY_USER' });
    }

    const onUserStopped = () => onExit({ reason: 'STOPPED_BY_USER' });
    ipcMain.once('stop-sync-process', onUserStopped);
    onExitFuncs.push(() =>
      ipcMain.removeListener('stop-sync-process', onUserStopped)
    );
  });
}

function spawnSyncWorker() {
  const worker = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  worker
    .loadFile(
      process.env.NODE_ENV === 'development'
        ? '../../release/app/dist/sync/index.html'
        : `${path.join(__dirname, '..', 'sync')}/index.html`
    )
    .catch(Logger.error);

  return worker;
}

ipcMain.on('SYNC_INFO_UPDATE', (_, payload: ProcessInfoUpdatePayload) => {
  broadcastToWindows('sync-info-update', payload);
});
