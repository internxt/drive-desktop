import { ipcMain } from 'electron';

import { ProcessResult } from '../../workers/process';
import {
  ProcessFatalErrorName,
  ProcessInfoUpdatePayload,
} from '../../workers/types';

import eventBus from '../event-bus';
import { setTrayStatus } from '../tray/tray';
import { broadcastToWindows } from '../windows';

export type SyncStatus = 'STANDBY' | 'RUNNING' | 'FAILED';

let syncStatus: SyncStatus = 'STANDBY';

export function getSyncStatus() {
  return syncStatus;
}

ipcMain.handle('get-sync-status', getSyncStatus);

export function changeSyncStatus(newStatus: SyncStatus) {
  syncStatus = newStatus;
  broadcastToWindows('sync-status-changed', newStatus);
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
  setTrayStatus('STANDBY');
});

eventBus.on('USER_WAS_UNAUTHORIZED', () => {
  ipcMain.emit('stop-sync-process');
  setTrayStatus('STANDBY');
});
