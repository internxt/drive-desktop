import { ipcMain } from 'electron';
import { BackupErrorsTracker } from '../backup-errors-tracker';

export function registerBackupFatalErrorsIpcHandler(backupErrors: BackupErrorsTracker) {
  ipcMain.handle('get-backup-fatal-errors', () => backupErrors.getAll());
  ipcMain.handle('get-backup-error-by-folder', (_, folderId: number) => backupErrors.get(folderId));
  ipcMain.handle('get-last-backup-had-issues', () => backupErrors.lastBackupHadFatalIssue());
}
