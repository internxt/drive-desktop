import { ipcMain } from 'electron';
import eventBus from '../../event-bus';
import { setupBackupConfig } from './BackupConfiguration/BackupConfiguration';
import { listenForBackupsErrors } from './BackupFatalErrors/listenForBackupErrors';
import { BackupScheduler } from './BackupScheduler/BackupScheduler';
import { handleBackupsStatusMessages } from './BackupsProcessStatus/handlers';
import { initiateBackupsProcessTracker } from './BackupsProcessTracker/BackupsProcessTracker';
import { BackupsStopController } from './BackupsStopController/BackupsStopController';
import { launchBackupProcesses } from './launchBackupProcesses';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import configStore from '../../config';
import { BACKUP_MANUAL_INTERVAL } from './types/types';

function userCanBackup(): boolean {
  const availableUserProducts = configStore.get('availableUserProducts');
  return !!availableUserProducts?.backups;
}

export async function setUpBackups() {
  logger.debug({ tag: 'BACKUPS', msg: 'Setting up backups' });
  const userHasBackupFeatureAvailable = userCanBackup();

  if (!userHasBackupFeatureAvailable) {
    logger.debug({ tag: 'BACKUPS', msg: 'User does not have the backup feature available' });
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
    if (interval === BACKUP_MANUAL_INTERVAL) {
      scheduler.stop();
      logger.debug({ tag: 'BACKUPS', msg: 'The backups schedule stopped' });
      return;
    } else {
      if (userHasBackupFeatureAvailable) {
        scheduler.reschedule();
        logger.debug({ tag: 'BACKUPS', msg: 'The backups has been rescheduled' });
      }
    }
  };

  function stopAndClearBackups() {
    ipcMain.emit('stop-backups-process');
    scheduler.stop();
    errors.clear();
    tracker.reset();
    stopController.reset();
    status.set('STANDBY');
  }

  eventBus.on('USER_LOGGED_OUT', stopAndClearBackups);
  eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearBackups);

  eventBus.on('USER_AVAILABLE_PRODUCTS_UPDATED', (updatedProducts) => {
    const userHasBackupFeatureNow = !!updatedProducts?.backups;
    if (userHasBackupFeatureNow && !userHasBackupFeatureAvailable) {
      logger.debug({
        tag: 'BACKUPS',
        msg: 'User now has the backup feature available, setting up backups'
      });
      setUpBackups();
    } else if (!userHasBackupFeatureNow && userHasBackupFeatureAvailable) {
      logger.debug({ tag: 'BACKUPS', msg: 'User no longer has the backup feature available' });
      stopAndClearBackups();
    }
  });

  ipcMain.on('start-backups-process', async () => {
    if (userHasBackupFeatureAvailable) {
      logger.debug({ tag: 'BACKUPS', msg: 'Backups started manually' });

      await launchBackupProcesses(
        false,
        tracker,
        status,
        errors,
        stopController
      );
    }
  });

  ipcMain.on('BACKUP_PROCESS_FINISHED', (event) => {

    if (event?.lastExitReason === 'FORCED_BY_USER') {
      logger.debug({ tag: 'BACKUPS', msg: 'Backups process finished by user' });
    } else {
      logger.debug({ tag: 'BACKUPS', msg: 'Backups process finished' });
    }
    stopAndClearBackups();
  });

  if (userHasBackupFeatureAvailable) {
    logger.debug({ tag: 'BACKUPS', msg: 'Start service' });
    await scheduler.start();

    if (scheduler.isScheduled()) {
      logger.debug({ tag: 'BACKUPS', msg: 'Backups schedule is set' });
    }

    logger.debug({ tag: 'BACKUPS', msg: 'Backups ready' });
  }
}
