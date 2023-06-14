import { ipcMain } from 'electron';

import { ProcessResult } from '../../workers/process';
import {
  ProcessFatalErrorName,
  ProcessInfoUpdatePayload,
} from '../../workers/types';

import eventBus from '../event-bus';
import { getTray } from '../tray';
import { broadcastToWindows } from '../windows';

import { getSyncIssues } from './process-issues';

export type SyncStatus = 'STANDBY' | 'RUNNING';

let syncStatus: SyncStatus = 'STANDBY';

export function getSyncStatus() {
  return syncStatus;
}

ipcMain.handle('get-sync-status', getSyncStatus);

export function setTraySyncStatus(newStatus: SyncStatus) {
  const tray = getTray();
  if (newStatus === 'RUNNING') {
    tray?.setState('SYNCING');
  } else if (getSyncIssues().length !== 0) {
    tray?.setState('ISSUES');
  } else {
    tray?.setState('STANDBY');
  }
}

/**
 * TODO Should listen to RemoteSyncManager status changes
 *
 */
function changeSyncStatus(newStatus: SyncStatus) {
  syncStatus = newStatus;
  broadcastToWindows('sync-status-changed', newStatus);
  setTraySyncStatus(newStatus);
}

export type SyncStoppedPayload =
  | {
      reason: 'STOPPED_BY_USER';
    }
  | {
      reason: 'FATAL_ERROR';
      errorName: ProcessFatalErrorName;
    }
  | { reason: 'EXIT'; result: ProcessResult };

ipcMain.on('SYNC_INFO_UPDATE', (_, payload: ProcessInfoUpdatePayload) => {
  broadcastToWindows('sync-info-update', payload);
});

eventBus.on('USER_LOGGED_OUT', () => {
  ipcMain.emit('stop-sync-process');
  setTraySyncStatus('STANDBY');
});

eventBus.on('USER_WAS_UNAUTHORIZED', () => {
  ipcMain.emit('stop-sync-process');
  setTraySyncStatus('STANDBY');
});
