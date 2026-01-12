import { ipcMain } from 'electron';
import { BackupsProcessStatus } from '../../../../apps/main/background-processes/backups/BackupsProcessStatus/BackupsProcessStatus';

export function registerBackupProcessStatusIpcHandler(status: BackupsProcessStatus) {
  ipcMain.handle('get-backups-status', () => status.current());
}
