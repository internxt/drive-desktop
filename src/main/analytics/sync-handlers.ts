import { ipcMain } from 'electron';
import { EnqueuedSyncActions } from '../../workers/types';
import {
  syncStarted,
  syncPaused,
  syncBlocked,
  syncError,
  syncFinished,
} from './service';

const syncProgressInfo = {
  totalActionsToPerform: 0,
  actionsPerformed: 0,
  errors: new Array<string>(),
};

ipcMain.on('SYNC_ACTION_QUEUE_GENERATED', (_, actions: EnqueuedSyncActions) => {
  const filesToUpload = actions.pullFromRemote?.length || 0;

  syncProgressInfo.totalActionsToPerform = filesToUpload;
  syncProgressInfo.errors = [];

  syncStarted(filesToUpload);
});

ipcMain.on('SYNC_INFO_UPDATE', (_, data) => {
  if (data.errorName) {
    syncProgressInfo.errors.push(
      `${data.errorName} error when ${data.errorDetails.action}`
    );
    return;
  }

  syncProgressInfo.actionsPerformed++;
});

ipcMain.on('sync-stopped', (payload: any) => {
  if (!payload) return;

  switch (payload.reason) {
    case 'STOPPED_BY_USER':
      syncPaused(syncProgressInfo.totalActionsToPerform);
      break;
    case 'COULD_NOT_ACQUIRE_LOCK':
      syncBlocked(syncProgressInfo.totalActionsToPerform);
      break;
    case 'FATAL_ERROR':
      syncError(syncProgressInfo.totalActionsToPerform);
      break;
    case 'EXIT':
      syncFinished(syncProgressInfo.totalActionsToPerform);
      break;
    default:
  }

  if (syncProgressInfo.errors.length > 0 && payload.reason !== 'FATAL_ERROR') {
    syncError(syncProgressInfo.totalActionsToPerform);
  }
});
