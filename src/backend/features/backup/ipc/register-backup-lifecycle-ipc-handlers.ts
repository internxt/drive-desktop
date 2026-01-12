import { logger } from '@internxt/drive-desktop-core/build/backend';
import { ipcMain } from 'electron';
import { backupManager } from '..';

export function registerBackupLifecycleIpcHandlers(userHasBackupFeatureAvailable: boolean) {
  ipcMain.on('start-backups-process', async () => {
    if (userHasBackupFeatureAvailable) {
      logger.debug({ tag: 'BACKUPS', msg: 'Backups started manually' });
      backupManager.startBackup();
    }
  });
  ipcMain.on('stop-backups-process', () => {
    logger.debug({ tag: 'BACKUPS', msg: 'Stopping backups' });
    backupManager.stopBackup();
  });
}
