import { ipcMain } from 'electron';
import configStore from '../../../config';
import { tracker } from '../BackupsProcessTracker/BackupsProcessTracker';

export function setupBackupConfig() {
  ipcMain.handle('get-backups-interval', () => {
    return configStore.get('backupInterval');
  });

  ipcMain.handle('get-last-backup-timestamp', () => {
    return configStore.get('lastBackup');
  });

  ipcMain.handle('get-backups-status', () => {
    return tracker.status;
  });
}
