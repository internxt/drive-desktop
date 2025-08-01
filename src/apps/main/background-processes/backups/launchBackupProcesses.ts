import { ipcMain, powerSaveBlocker } from 'electron';
import { executeBackupWorker } from './BackukpWorker/executeBackupWorker';
import { backupsConfig } from './BackupConfiguration/BackupConfiguration';
import { BackupsProcessStatus } from './BackupsProcessStatus/BackupsProcessStatus';
import { BackupsProcessTracker } from './BackupsProcessTracker/BackupsProcessTracker';
import { isAvailableBackups } from '../../ipcs/ipcMainAntivirus';
import { logger } from '@/apps/shared/logger/logger';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { IssuesModule } from '@internxt/drive-desktop-core/build/backend';

function backupsCanRun(status: BackupsProcessStatus) {
  return status.isIn('STANDBY') && backupsConfig.enabled;
}

export async function launchBackupProcesses(
  scheduled: boolean,
  tracker: BackupsProcessTracker,
  status: BackupsProcessStatus,
): Promise<void> {
  if (!backupsCanRun(status)) {
    logger.debug({ tag: 'BACKUPS', msg: 'Already running', status });
    return;
  }

  const isAvailable = await isAvailableBackups();

  if (!isAvailable) {
    logger.debug({ msg: 'Backups not available' });
    return;
  }

  const abortController = new AbortController();

  ipcMain.once('stop-backups-process', () => {
    logger.debug({ tag: 'BACKUPS', msg: 'Backups aborted' });
    abortController.abort();
    status.set('STOPPING');
  });

  status.set('RUNNING');

  const suspensionBlockId = powerSaveBlocker.start('prevent-display-sleep');

  const backups = await backupsConfig.obtainBackupsInfo();

  logger.debug({ tag: 'BACKUPS', msg: 'Launching backups', scheduled, backups });

  IssuesModule.clearBackupsIssues();
  tracker.track(backups, abortController);

  for (const backupInfo of backups) {
    logger.debug({
      tag: 'BACKUPS',
      msg: 'Backup folder',
      backupInfo,
    });

    if (abortController.signal.aborted) {
      break;
    }

    const context: BackupsContext = {
      ...backupInfo,
      abortController,
      addIssue: (issue) => {
        IssuesModule.addBackupsIssue({
          ...issue,
          folderUuid: backupInfo.folderUuid,
        });
      },
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
