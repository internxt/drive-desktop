import { ipcMain, powerSaveBlocker } from 'electron';
import { executeBackupWorker } from './BackukpWorker/executeBackupWorker';
import { backupsConfig } from './BackupConfiguration/BackupConfiguration';
import { logger } from '@/apps/shared/logger/logger';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { addBackupsIssue, clearBackupsIssues } from '../issues';
import { getAvailableProducts } from '../../payments/get-available-products';
import { getUser } from '../../auth/service';
import { buildUserEnvironment } from './build-environment';
import { tracker } from './BackupsProcessTracker/BackupsProcessTracker';
import { status } from './BackupsProcessStatus/BackupsProcessStatus';
import electronStore from '../../config';
import { BackupScheduler } from './BackupScheduler/BackupScheduler';

export async function launchBackupProcesses(): Promise<void> {
  const user = getUser();

  if (!user) return;

  if (!status.isIn('STANDBY')) {
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

  logger.debug({ tag: 'BACKUPS', msg: 'Launching backups', backups });

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

    const { environment } = buildUserEnvironment({ user, type: 'backups' });
    const context: BackupsContext = {
      ...backupInfo,
      userUuid: user.uuid,
      bucket: backupInfo.backupsBucket,
      workspaceId: '',
      workspaceToken: '',
      environment,
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
  electronStore.set('lastBackup', Date.now());
  BackupScheduler.start();

  ipcMain.removeAllListeners('stop-backups-process');

  powerSaveBlocker.stop(suspensionBlockId);
}
