import { ipcMain, powerSaveBlocker } from 'electron';
import { executeBackupWorker } from './BackukpWorker/executeBackupWorker';
import { backupsConfig } from './BackupConfiguration/BackupConfiguration';
import { BackupsProcessStatus } from './BackupsProcessStatus/BackupsProcessStatus';
import { BackupsProcessTracker } from './BackupsProcessTracker/BackupsProcessTracker';
import { logger } from '@/apps/shared/logger/logger';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { addBackupsIssue, clearBackupsIssues } from '../issues';
import { buildFileUploader } from './build-file-uploader';
import { getUserOrThrow } from '../../auth/service';
import { getAvailableProducts } from '../../payments/get-available-products';

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

  const availableProducts = await getAvailableProducts();
  const isBackupsEnabled = Boolean(availableProducts?.backups);

  if (!isBackupsEnabled) {
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

  clearBackupsIssues();
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

    const user = getUserOrThrow();
    const { fileUploader } = buildFileUploader({ bucket: backupInfo.backupsBucket });
    const context: BackupsContext = {
      ...backupInfo,
      userUuid: user.uuid,
      workspaceId: '',
      fileUploader,
      abortController,
      addIssue: (issue) => {
        addBackupsIssue({
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
