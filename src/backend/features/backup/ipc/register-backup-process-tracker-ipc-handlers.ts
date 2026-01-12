import { ipcMain } from 'electron';
import { BackupsProcessTracker } from '../../../../apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { isSyncError } from '../../../../shared/issues/SyncErrorCause';

export function registerBackupProcessTrackerIpcHandlers(tracker: BackupsProcessTracker) {
  ipcMain.handle('get-last-backup-exit-reason', () => {
    return tracker.getLastExitReason();
  });
  ipcMain.handle('backups.get-backup-issues', (_, backupFolderId) => {
    // TODO: I added this handler because it was already defined, but it can be pretty much removed.
    const reason = tracker.getExitReason(backupFolderId);

    if (reason !== undefined && isSyncError(reason)) {
      return reason;
    }

    return undefined;
  });
}
