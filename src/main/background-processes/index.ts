import { ipcMain } from 'electron';
import configStore from '../config';
import {
  clearBackupsTimeout,
  scheduleBackups,
  startBackupProcess,
} from './backups';
import {
  clearSyncIssues,
  clearSyncTimeout,
  scheduleSync,
  setTraySyncStatus,
  startSyncProcess,
  SYNC_INTERVAL,
} from './sync';

export function startBackgroundProcesses() {
  // Check if we should launch sync process
  const lastSync = configStore.get('lastSync');

  if (lastSync !== -1) {
    const currentTimestamp = new Date().valueOf();

    const millisecondsToNextSync = lastSync + SYNC_INTERVAL - currentTimestamp;

    if (millisecondsToNextSync <= 0) {
      startSyncProcess();
    } else {
      scheduleSync(millisecondsToNextSync);
    }
  }

  // Check if we should launch backup process
  const lastBackup = configStore.get('lastBackup');
  const backupsInterval = configStore.get('backupInterval');

  if (lastBackup !== -1 && backupsInterval !== -1) {
    const currentTimestamp = new Date().valueOf();

    const millisecondsToNextBackup =
      lastBackup + backupsInterval - currentTimestamp;

    if (millisecondsToNextBackup <= 0) {
      startBackupProcess();
    } else {
      scheduleBackups(millisecondsToNextBackup);
    }
  }
}

export function cleanBackgroundProcesses() {
  // stop processes
  ipcMain.emit('stop-sync-process');
  ipcMain.emit('stop-backups-process');

  // clear timeouts
  clearSyncTimeout();
  clearBackupsTimeout();

  clearSyncIssues();
  setTraySyncStatus('STANDBY');
}
