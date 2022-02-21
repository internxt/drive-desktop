import { ipcMain } from 'electron';
import configStore from '../config';
import { clearPendingChanges, stopLocalWatcher } from '../realtime';
import {
  clearBackupFatalErrors,
  clearBackupsLastExitReason,
  clearBackupsTimeout,
  scheduleBackups,
  startBackupProcess,
} from './backups';
import { clearBackupsIssues, clearSyncIssues } from './process-issues';
import { setTraySyncStatus, startSyncProcess } from './sync';

export function startBackgroundProcesses() {
  startSyncProcess();

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
  clearBackupsTimeout();

  clearSyncIssues();
  clearBackupsIssues();
  clearBackupsLastExitReason();
  clearBackupFatalErrors();
  setTraySyncStatus('STANDBY');

  clearPendingChanges();
  stopLocalWatcher();
}
