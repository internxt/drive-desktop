import { ipcMain } from 'electron';
import { BackupsProcessStatus } from './BackupsProcessStatus';

export function handleBackupsStatusMessages(): BackupsProcessStatus {
  const status = new BackupsProcessStatus('STANDBY');

  ipcMain.handle('get-backups-status', () => status.current());

  return status;
}
