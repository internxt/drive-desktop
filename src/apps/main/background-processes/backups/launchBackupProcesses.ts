import { ipcMain, powerSaveBlocker } from 'electron';
import { executeBackupWorker } from './BackukpWorker/executeBackupWorker';
import { backupsConfig } from './BackupConfiguration/BackupConfiguration';
import { BackupsProcessStatus } from './BackupsProcessStatus/BackupsProcessStatus';
import { BackupsProcessTracker } from './BackupsProcessTracker/BackupsProcessTracker';
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
): Promise<void> {
  if (!backupsCanRun(status)) {
    logger.debug({ tag: 'BACKUPS', msg: 'Already running' });
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
    logger.debug({ tag: 'BACKUPS', msg: 'Backups aborted' });
    abortController.abort();
  });

  tracker.track(backups, abortController);

  for (const backupInfo of backups) {
    logger.debug({
      tag: 'BACKUPS',
      msg: 'Backup folder',
      backupInfo,
    });

    if (abortController.signal.aborted) {
      continue;
    }

    const context: BackupsContext = {
      ...backupInfo,
      abortController,
    };

    tracker.backing();

    await executeBackupWorker(tracker, context);
  }

  status.set('STANDBY');

  tracker.reset();
  backupsConfig.backupFinished();

  ipcMain.removeAllListeners('stop-backups-process');

  powerSaveBlocker.stop(suspensionBlockId);
}
