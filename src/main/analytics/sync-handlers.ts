import { ipcMain } from 'electron';
import { EnqueuedSyncActions } from '../../workers/types';
import { SyncStoppedPayload } from '../background-processes/sync';
import { syncStarted, syncPaused, syncBlocked, syncError } from './service';

const syncProgressInfo = {
  totalActionsToPerform: 0,
  actionsPerformed: 0,
};

ipcMain.on('SYNC_ACTION_QUEUE_GENERATED', (_, actions: EnqueuedSyncActions) => {
  const totalFiles = Object.values(actions).flat().length;

  syncProgressInfo.totalActionsToPerform = totalFiles;

  syncStarted(totalFiles);
});

ipcMain.on('SYNC_INFO_UPDATE', (_, data) => {
  if (data.errorName) {
    syncError(syncProgressInfo.actionsPerformed);
    return;
  }

  syncProgressInfo.actionsPerformed++;
});

ipcMain.on('sync-stopped', (_, payload: SyncStoppedPayload) => {
  if (!payload) return;

  switch (payload.reason) {
    case 'STOPPED_BY_USER':
      syncPaused(syncProgressInfo.actionsPerformed);
      break;
    case 'COULD_NOT_ACQUIRE_LOCK':
      syncBlocked(syncProgressInfo.actionsPerformed);
      break;
    case 'FATAL_ERROR':
      syncError(syncProgressInfo.actionsPerformed);
      break;
    default:
  }
});
