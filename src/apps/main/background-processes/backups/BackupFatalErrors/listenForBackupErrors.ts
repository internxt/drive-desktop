import { ipcMain } from 'electron';
import { BackupFatalErrors, BackupErrorsCollection } from './BackupFatalErrors';
import { broadcastToWindows } from '../../../windows';
import { BackupsIPCMain } from '../BackupsIpc';

export function listenForBackupsErrors() {
  const backupErrors = new BackupFatalErrors(
    (errors: BackupErrorsCollection) => {
      broadcastToWindows('backup-fatal-errors-changed', errors);
    }
  );

  ipcMain.handle('get-backup-fatal-errors', () => backupErrors.get());

  BackupsIPCMain.on('backups.file-issue', (_, name, error) => {
    backupErrors.add({ name, error });
  });

  return backupErrors;
}
