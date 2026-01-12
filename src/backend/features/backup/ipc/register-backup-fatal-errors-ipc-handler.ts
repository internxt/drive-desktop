import { ipcMain } from 'electron';
import { BackupFatalErrors } from '../../../../apps/main/background-processes/backups/BackupFatalErrors/BackupFatalErrors';

export function registerBackupFatalErrorsIpcHandler(backupErrors: BackupFatalErrors) {
  ipcMain.handle('get-backup-fatal-errors', () => backupErrors.get());
}
