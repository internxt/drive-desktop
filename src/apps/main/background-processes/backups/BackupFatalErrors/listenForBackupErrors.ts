import { ipcMain } from 'electron';
import { BackupFatalErrors, BackupErrorsCollection } from './BackupFatalErrors';
import { broadcastToWindows } from '../../../windows';

export function listenForBackupsErrors() {
  const backupErrors = new BackupFatalErrors((errors: BackupErrorsCollection) => {
    broadcastToWindows('backup-fatal-errors-changed', errors);
  });

  ipcMain.handle('get-backup-fatal-errors', () => backupErrors.get());

  return backupErrors;
}
