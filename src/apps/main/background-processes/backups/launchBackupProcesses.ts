import { ipcMain, powerSaveBlocker } from 'electron';
import Logger from 'electron-log';
import { executeBackupWorker } from './BackukpWorker/executeBackupWorker';
import { backupsConfig } from './BackupConfiguration/BackupConfiguration';
import { BackupFatalErrors } from './BackupFatalErrors/BackupFatalErrors';
import { BackupsProcessStatus } from './BackupsProcessStatus/BackupsProcessStatus';
import { BackupsProcessTracker } from './BackupsProcessTracker/BackupsProcessTracker';
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

  const abortController = new AbortController();

  ipcMain.once('stop-backups-process', () => {
    abortController.abort();
  });

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
      logger.debug({ tag: 'BACKUPS', msg: 'Backups aborted' });
      continue;
    }

    const endReason = await executeBackupWorker(tracker, context);

    if (isSyncError(endReason)) {
      errors.add({ name: backupInfo.plainName, error: endReason });
    }

    Logger.info(`Backup process for ${backupInfo.folderId} ended with ${endReason}`);

    tracker.backupFinished(backupInfo.folderId, endReason);
  }

  status.set('STANDBY');

  tracker.reset();
  backupsConfig.backupFinished();

  ipcMain.removeAllListeners('stop-backups-process');

  powerSaveBlocker.stop(suspensionBlockId);
}
