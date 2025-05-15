import { ipcMain, powerSaveBlocker } from 'electron';
import Logger from 'electron-log';
import { executeBackupWorker } from './BackukpWorker/executeBackupWorker';
import { backupsConfig } from './BackupConfiguration/BackupConfiguration';
import { BackupFatalErrors } from './BackupFatalErrors/BackupFatalErrors';
import { BackupsProcessStatus } from './BackupsProcessStatus/BackupsProcessStatus';
import { BackupsProcessTracker } from './BackupsProcessTracker/BackupsProcessTracker';
import { BackupsStopController } from './BackupsStopController/BackupsStopController';
import { isSyncError } from '../../../shared/issues/SyncErrorCause';
import { isAvailableBackups } from '../../ipcs/ipcMainAntivirus';
import { logger } from '@/apps/shared/logger/logger';
import { BackupsContext } from '@/apps/backups/BackupInfo';

function backupsCanRun(status: BackupsProcessStatus) {
  return status.isIn('STANDBY') && backupsConfig.enabled;
}

export async function launchBackupProcesses(
  scheduled: boolean,
  tracker: BackupsProcessTracker,
  status: BackupsProcessStatus,
  errors: BackupFatalErrors,
  stopController: BackupsStopController,
): Promise<void> {
  if (!backupsCanRun(status)) {
    Logger.debug('[BACKUPS] Already running');
    return;
  }

  const isAvailable = await isAvailableBackups();

  if (!isAvailable) {
    logger.debug({ msg: 'Backups not available' });
    return;
  }

  status.set('RUNNING');

  const suspensionBlockId = powerSaveBlocker.start('prevent-display-sleep');

  const backups = await backupsConfig.obtainBackupsInfo();

  logger.debug({ tag: 'BACKUPS', msg: 'Launching backups', scheduled, backups });

  stopController.on('forced-by-user', () => {
    Logger.debug('[BACKUPS] Stopping backups');

    ipcMain.emit('BACKUP_PROCESS_FINISHED', {
      scheduled,
      foldersToBackup: tracker.totalBackups(),
      lastExitReason: 'FORCED_BY_USER',
    });
  });

  stopController.on('backup-completed', () => {
    ipcMain.emit('BACKUP_PROCESS_FINISHED', {
      scheduled,
      foldersToBackup: tracker.totalBackups(),
      lastExitReason: 'PROCESS_FINISHED',
    });
  });

  ipcMain.once('stop-backups-process', () => {
    stopController.stop('forced-by-user');
  });

  const abortController = new AbortController();

  // clearBackupsIssues();
  errors.clear();
  tracker.track(backups, abortController);

  for (const backupInfo of backups) {
    logger.debug({
      tag: 'BACKUPS',
      msg: 'Backup folder',
      backupInfo,
    });

    const context: BackupsContext = {
      ...backupInfo,
      abortController,
      errors,
    };

    tracker.backing();

    if (abortController.signal.aborted) {
      logger.debug({ tag: 'BACKUPS', msg: 'Stop controller stopped' });
      continue;
    }

    const endReason = await executeBackupWorker(tracker, context, stopController);

    if (isSyncError(endReason)) {
      errors.add({ name: backupInfo.plainName, error: endReason });
    }

    Logger.info(`Backup process for ${backupInfo.folderId} ended with ${endReason}`);

    tracker.backupFinished(backupInfo.folderId, endReason);
  }

  status.set('STANDBY');

  tracker.reset();
  stopController.reset();
  backupsConfig.backupFinished();

  ipcMain.removeAllListeners('stop-backups-process');

  powerSaveBlocker.stop(suspensionBlockId);

  ipcMain.emit('BACKUPS:PROCESS_FINISHED');
}
