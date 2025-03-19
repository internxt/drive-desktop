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
import configStore from '../../config';

function userCanBackup(): boolean {
  const availableUserProducts = configStore.get('availableUserProducts');
  return !!availableUserProducts?.backups;
}

export async function setUpBackups() {
  Logger.debug('[BACKUPS] Setting up backups');
  const userHasBackupFeatureAvailable = userCanBackup();

  if (!userHasBackupFeatureAvailable) {
    Logger.debug('[BACKUPS] User does not have the backup feature available');
  }

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

    if (userHasBackupFeatureAvailable) {
      scheduler.reschedule();
      Logger.debug('[BACKUPS] The backups has been rescheduled');
    }
  };

  function stopAndClearBackups() {
    ipcMain.emit('stop-backups-process');
    scheduler.stop();
    errors.clear();
    tracker.reset();
  }

  eventBus.on('USER_LOGGED_OUT', stopAndClearBackups);
  eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearBackups);

  eventBus.on('USER_AVAILABLE_PRODUCTS_UPDATED', (updatedProducts) => {
    const userHasBackupFeatureNow = !!updatedProducts?.backups;
    if (userHasBackupFeatureNow && !userHasBackupFeatureAvailable) {
      Logger.debug(
        '[BACKUPS] User now has the backup feature available, setting up backups'
      );
      setUpBackups();
    } else if (!userHasBackupFeatureNow && userHasBackupFeatureAvailable) {
      Logger.debug('[BACKUPS] User no longer has the backup feature available');
      stopAndClearBackups();
    }
  });

  ipcMain.on('start-backups-process', async () => {
    if (userHasBackupFeatureAvailable) {
      Logger.debug('Backups started manually');

      await launchBackupProcesses(
        false,
        tracker,
        status,
        errors,
        stopController
      );
    }
  });

  if (userHasBackupFeatureAvailable) {
    Logger.debug('[BACKUPS] Start service');
    await scheduler.start();

    if (scheduler.isScheduled()) {
      Logger.debug('[BACKUPS] Backups schedule is set');
    }

    Logger.debug('[BACKUPS] Backups ready');
  }
}
