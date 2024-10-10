import { ipcMain } from 'electron';
import eventBus from '../../event-bus';
import { setupBackupConfig } from './BackupConfiguration/BackupConfiguration';
import { listenForBackupsErrors } from './BackupFatalErrors/listenForBackupErrors';
import { BackupScheduler } from './BackupScheduler/BackupScheduler';
import { handleBackupsStatusMessages } from './BackupsProcessStatus/handlers';
import { initiateBackupsProcessTracker } from './BackupsProcessTracker/BackupsProcessTracker';
import { BackupsStopController } from './BackupsStopController/BackupsStopController';
import { launchBackupProcesses } from './launchBackupProcesses';
import Logger from 'electron-log';

export async function setUpBackups() {
  Logger.debug('[BACKUPS] Setting up backups');

  const backupConfiguration = setupBackupConfig();
  const tracker = initiateBackupsProcessTracker();
  const errors = listenForBackupsErrors();
  const status = handleBackupsStatusMessages();
  const stopController = new BackupsStopController();
  const scheduler = new BackupScheduler(
    () => backupConfiguration.lastBackup,
    () => backupConfiguration.backupInterval,
    () => launchBackupProcesses(true, tracker, status, errors, stopController)
  );

  backupConfiguration.onBackupIntervalChanged = (interval: number) => {
    if (interval === -1) {
      scheduler.stop();
      Logger.info('[BACKUPS] The backups schedule stopped');
      return;
    }

    scheduler.reschedule();
    Logger.debug('[BACKUPS] The backups has been rescheduled');
  };

  function stopAndClearBackups() {
    ipcMain.emit('stop-backups-process');
    scheduler.stop();
    errors.clear();
    tracker.reset();
  }

  eventBus.on('USER_LOGGED_OUT', stopAndClearBackups);
  eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearBackups);

  ipcMain.on('start-backups-process', async () => {
    Logger.debug('Backups started manually');

    await launchBackupProcesses(false, tracker, status, errors, stopController);
  });

  Logger.debug('[BACKUPS] Start service');

  await scheduler.start();

  if (scheduler.isScheduled()) {
    Logger.debug('[BACKUPS] Backups schedule is set');
  }

  Logger.debug('[BACKUPS] Backups ready');
}
