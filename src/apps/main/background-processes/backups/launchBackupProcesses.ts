import { ipcMain, powerSaveBlocker } from 'electron';
import Logger from 'electron-log';
import { executeBackupWorker } from './BackukpWorker/executeBackupWorker';
import { backupsConfig } from './BackupConfiguration/BackupConfiguration';
import { BackupFatalErrors } from './BackupFatalErrors/BackupFatalErrors';
import { BackupsProcessStatus } from './BackupsProcessStatus/BackupsProcessStatus';
import { BackupsProcessTracker } from './BackupsProcessTracker/BackupsProcessTracker';
import { BackupsStopController } from './BackupsStopController/BackupsStopController';

import { isSyncError } from '../../../../shared/issues/SyncErrorCause';

function backupsCanRun(status: BackupsProcessStatus) {
  return status.isIn('STANDBY') && backupsConfig.enabled;
}

export async function launchBackupProcesses(
  scheduled: boolean,
  tracker: BackupsProcessTracker,
  status: BackupsProcessStatus,
  errors: BackupFatalErrors,
  stopController: BackupsStopController
): Promise<void> {
  if (!backupsCanRun(status)) {
    Logger.debug('[BACKUPS] Already running');
    return;
  }

  Logger.debug('[BACKUPS] Launching backups process');
  status.set('RUNNING');

  const suspensionBlockId = powerSaveBlocker.start('prevent-display-sleep');

  const backups = await backupsConfig.obtainBackupsInfo();

  errors.clear();

  tracker.track(backups);

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
    stopController.userCancelledBackup();
  });

  for (const backupInfo of backups) {
    tracker.backing(backupInfo);

    if (stopController.hasStopped()) {
      Logger.debug('[BACKUPS] Stop controller stopped');
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const endReason = await executeBackupWorker(backupInfo, stopController);

    if (isSyncError(endReason)) {
      errors.add({ name: backupInfo.name, error: endReason });
    }

    Logger.info(
      `Backup process for ${backupInfo.folderId} ended with ${endReason}`
    );

    tracker.backupFinished(backupInfo.folderId, endReason);
  }

  status.set('STANDBY');

  tracker.reset();
  stopController.reset();

  ipcMain.removeAllListeners('stop-backups-process');

  powerSaveBlocker.stop(suspensionBlockId);

  ipcMain.emit('BACKUPS:PROCESS_FINISHED');
}
