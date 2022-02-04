import { BrowserWindow, ipcMain, powerSaveBlocker } from 'electron';
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

let backupsStatus: BackupsStatus = 'STANDBY';
let backupsProcessRerun: null | ReturnType<typeof setTimeout> = null;

ipcMain.handle('get-backups-status', () => backupsStatus);

ipcMain.handle('get-backups-enabled', () => configStore.get('backupsEnabled'));

ipcMain.handle('toggle-backups-enabled', () => {
  configStore.set('backupsEnabled', !configStore.get('backupsEnabled'));
});

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

  const items: BackupsArgs[] = [];

  for (const item of items) {
    await processBackupsItem(item, hasBeenStopped);
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
}

async function processBackupsItem(
  item: BackupsArgs,
  hasBeenStopped: { value: boolean }
) {
  ipcMain.handleOnce('get-backups-details', () => item);
  spawnBackupsWorker();
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
