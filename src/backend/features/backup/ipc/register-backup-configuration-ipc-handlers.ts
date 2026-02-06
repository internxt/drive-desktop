import { ipcMain } from 'electron';
import { backupsConfig } from '..';
import { BACKUP_MANUAL_INTERVAL } from '../constants';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { BackupManager } from '../backup-manager';

export function registerBackupConfigurationIpcHandlers(manager: BackupManager) {
  ipcMain.handle('get-backups-interval', () => {
    return backupsConfig.backupInterval;
  });

  ipcMain.handle('set-backups-interval', (_, interval: number) => {
    backupsConfig.backupInterval = interval;
    if (interval === BACKUP_MANUAL_INTERVAL) {
      manager.stopScheduler();
      logger.debug({ tag: 'BACKUPS', msg: 'The backups schedule stopped' });
      return;
    } else {
      manager.rescheduleBackups();
      logger.debug({ tag: 'BACKUPS', msg: 'The backups has been rescheduled' });
    }
  });

  ipcMain.handle('get-last-backup-timestamp', () => {
    return backupsConfig.lastBackup;
  });

  ipcMain.handle('get-backups-enabled', () => {
    return backupsConfig.enabled;
  });

  ipcMain.handle('toggle-backups-enabled', () => {
    backupsConfig.toggleEnabled();
  });

  ipcMain.handle('user.get-has-discovered-backups', () => {
    return backupsConfig.hasDiscoveredBackups();
  });

  ipcMain.on('user.set-has-discovered-backups', () => {
    return backupsConfig.backupsDiscovered();
  });
}
