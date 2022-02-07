import { app, BrowserWindow, ipcMain, powerSaveBlocker } from 'electron';
import Logger from 'electron-log';
import path from 'path';
import { BackupsArgs } from '../../workers/backups';
import { getIsLoggedIn } from '../auth/handlers';
import configStore from '../config';
import { broadcastToWindows } from '../windows';
import { clearBackupsIssues } from './process-issues';

ipcMain.handle('get-backups-interval', () => {
  return configStore.get('backupInterval');
});

ipcMain.handle('set-backups-interval', (_, newValue: number) => {
  return configStore.set('backupInterval', newValue);
});

export type BackupsStatus = 'STANDBY' | 'RUNNING';
export type BackupExitReason = 'FORCED_BY_USER' | 'PROCESS_FINISHED';

let backupsStatus: BackupsStatus = 'STANDBY';
let backupsProcessRerun: null | ReturnType<typeof setTimeout> = null;
let backupsLastExitReason: BackupExitReason | null = null;

ipcMain.handle('get-backups-status', () => backupsStatus);

ipcMain.handle('get-backups-enabled', () => configStore.get('backupsEnabled'));

ipcMain.handle('toggle-backups-enabled', () => {
  configStore.set('backupsEnabled', !configStore.get('backupsEnabled'));
});

ipcMain.handle('get-last-backup-timestamp', () =>
  configStore.get('lastBackup')
);

ipcMain.handle('get-last-backup-exit-reason', () => backupsLastExitReason);

export function clearBackupsLastExitReason() {
  backupsLastExitReason = null;
}

export function clearBackupsTimeout() {
  if (backupsProcessRerun) clearTimeout(backupsProcessRerun);
}

export function scheduleBackups(milliseconds: number) {
  backupsProcessRerun = setTimeout(startBackupProcess, milliseconds);
}

function changeBackupsStatus(newStatus: BackupsStatus) {
  backupsStatus = newStatus;
  broadcastToWindows('backups-status-changed', newStatus);
}

ipcMain.on('start-backups-process', startBackupProcess);

export async function startBackupProcess() {
  const backupsEnabled = configStore.get('backupsEnabled');

  if (backupsStatus === 'RUNNING' || !backupsEnabled) return;

  const suspensionBlockId = powerSaveBlocker.start('prevent-app-suspension');

  changeBackupsStatus('RUNNING');
  clearBackupsIssues();

  // It's an object to pass it to
  // the individual item processors
  const hasBeenStopped = { value: false };

  ipcMain.once('stop-backups-process', () => {
    hasBeenStopped.value = true;
  });

  const backupList = configStore.get('backupList');

  const enabledBackupEntries = Object.entries(backupList).filter(
    ([, backup]) => backup.enabled
  );

  const items: BackupsArgs[] = enabledBackupEntries.map(
    ([pathname, backup]) => ({
      path: pathname,
      folderId: backup.folderId,
      tmpPath: app.getPath('temp'),
    })
  );

  for (const item of items) {
    if (!hasBeenStopped.value) await processBackupsItem(item, hasBeenStopped);
  }

  const currentTimestamp = new Date().valueOf();

  configStore.set('lastBackup', currentTimestamp);

  clearBackupsTimeout();

  const backupsInterval = configStore.get('backupInterval');

  if (backupsInterval !== -1 && getIsLoggedIn())
    scheduleBackups(backupsInterval);

  changeBackupsStatus('STANDBY');

  ipcMain.removeAllListeners('stop-backups-process');

  powerSaveBlocker.stop(suspensionBlockId);

  backupsLastExitReason = hasBeenStopped.value
    ? 'FORCED_BY_USER'
    : 'PROCESS_FINISHED';
}

function processBackupsItem(
  item: BackupsArgs,
  hasBeenStopped: { value: boolean }
) {
  return new Promise<void>((resolve) => {
    const onExitFuncs: (() => void)[] = [];

    function onExit(
      reason: 'USER_STOPPED' | 'FATAL_ERROR' | 'PROCESS_FINISHED'
    ) {
      Logger.log(
        `[onBackupsExit] ${item.path} (${item.folderId}) reason: ${reason}`
      );
      onExitFuncs.forEach((f) => f());

      resolve();
    }

    if (hasBeenStopped.value) {
      return onExit('USER_STOPPED');
    }

    ipcMain.handleOnce('get-backups-details', () => item);
    onExitFuncs.push(() => ipcMain.removeHandler('get-backups-details'));

    ipcMain.once('BACKUP_FATAL_ERROR', (_, errorName) => onExit('FATAL_ERROR'));
    onExitFuncs.push(() => ipcMain.removeAllListeners('BACKUP_FATAL_ERROR'));

    ipcMain.once('BACKUP_EXIT', () => onExit('PROCESS_FINISHED'));
    onExitFuncs.push(() => ipcMain.removeAllListeners('BACKUP_EXIT'));

    const worker = spawnBackupsWorker();
    onExitFuncs.push(() => worker.destroy());

    if (hasBeenStopped.value) {
      return onExit('USER_STOPPED');
    }

    const onUserStopped = () => onExit('USER_STOPPED');
    ipcMain.once('stop-backups-process', onUserStopped);
    onExitFuncs.push(() =>
      ipcMain.removeListener('stop-backups-process', onUserStopped)
    );
  });
}

function spawnBackupsWorker() {
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
        ? '../../release/app/dist/backups/index.html'
        : `${path.join(__dirname, '..', 'backups')}/index.html`
    )
    .catch(Logger.error);

  return worker;
}
