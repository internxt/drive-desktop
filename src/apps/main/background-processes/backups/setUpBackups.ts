import { ipcMain } from 'electron';
import eventBus from '../../event-bus';
import { setupBackupConfig } from './BackupConfiguration/BackupConfiguration';
import { BackupScheduler } from './BackupScheduler/BackupScheduler';
import { handleBackupsStatusMessages } from './BackupsProcessStatus/handlers';
import { launchBackupProcesses } from './launchBackupProcesses';
import { logger } from '@/apps/shared/logger/logger';
import { tracker } from './BackupsProcessTracker/BackupsProcessTracker';

export async function setUpBackups() {
  logger.debug({ tag: 'BACKUPS', msg: 'Setting up backups' });

  const backupConfiguration = setupBackupConfig();
  const status = handleBackupsStatusMessages();
  const scheduler = new BackupScheduler(
    () => backupConfiguration.lastBackup,
    () => backupConfiguration.backupInterval,
    () => launchBackupProcesses(true, tracker, status),
  );

  backupConfiguration.onBackupIntervalChanged = (interval: number) => {
    if (interval === -1) {
      scheduler.stop();
      logger.debug({ msg: '[BACKUPS] The backups schedule stopped' });
      return;
    }

    scheduler.reschedule();
    logger.debug({ msg: '[BACKUPS] The backups has been rescheduled' });
  };

  function stopAndClearBackups() {
    ipcMain.emit('stop-backups-process');
    scheduler.stop();
    tracker.reset();
  }

  eventBus.on('USER_LOGGED_OUT', stopAndClearBackups);

  ipcMain.on('start-backups-process', async () => {
    logger.debug({ msg: 'Backups started manually' });

    await launchBackupProcesses(false, tracker, status);
  });

  logger.debug({ msg: '[BACKUPS] Start service' });

  await scheduler.start();

  if (scheduler.isScheduled()) {
    logger.debug({ msg: '[BACKUPS] Backups schedule is set' });
  }

  logger.debug({ msg: '[BACKUPS] Backups ready' });
}
