import { ipcMain } from 'electron';
import configStore from '../config';
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
}

export function cleanBackgroundProcesses() {
  // stop processes
  ipcMain.emit('stop-sync-process');

  // clear timeouts
  clearSyncTimeout();

  clearSyncIssues();
  setTraySyncStatus('STANDBY');
}
