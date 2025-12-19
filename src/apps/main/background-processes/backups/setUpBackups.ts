import { ipcMain } from 'electron';
import { eventBus } from '../../event-bus';
import { BackupScheduler } from './BackupScheduler/BackupScheduler';
import { launchBackupProcesses } from './launchBackupProcesses';
import { tracker } from './BackupsProcessTracker/BackupsProcessTracker';
import { electronStore } from '../../config';
import { setupBackupConfig } from './BackupConfiguration/BackupConfiguration';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export function setUpBackups() {
  logger.debug({ msg: 'Setting up backups' });

  setupBackupConfig();

  ipcMain.handle('set-backups-interval', (_, interval: number) => {
    logger.debug({ msg: 'Backup interval has been changed', interval });
    electronStore.set('backupInterval', interval);
    BackupScheduler.start();
  });

  function stopAndClearBackups() {
    ipcMain.emit('stop-backups-process');
    BackupScheduler.stop();
    tracker.reset();
  }

  eventBus.on('USER_LOGGED_OUT', stopAndClearBackups);

  ipcMain.on('start-backups-process', async () => {
    logger.debug({ msg: 'Backups started manually' });
    await launchBackupProcesses();
  });

  BackupScheduler.start();
}
