import { ipcMain, powerSaveBlocker } from 'electron';
import { executeBackupWorker } from './BackukpWorker/executeBackupWorker';
import { createLogger, logger } from '@/apps/shared/logger/logger';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { addBackupsIssue, clearBackupsIssues } from '../issues';
import { getAvailableProducts } from '../../payments/get-available-products';
import { getUser } from '../../auth/service';
import { buildUserEnvironment } from './build-environment';
import { tracker } from './BackupsProcessTracker/BackupsProcessTracker';
import electronStore from '../../config';
import { BackupScheduler } from './BackupScheduler/BackupScheduler';
import { AuthContext } from '@/apps/sync-engine/config';
import { obtainBackupsInfo } from './BackupConfiguration/BackupConfiguration';
import Bottleneck from 'bottleneck';

type Props = {
  ctx: AuthContext;
};

export async function launchBackupProcesses({ ctx }: Props) {
  const user = getUser();

  if (!user) return;

  if (tracker.status !== 'STANDBY') {
    logger.debug({ tag: 'BACKUPS', msg: 'Already running', status: tracker.status });
    return;
  }

  const availableProducts = await getAvailableProducts();
  const isBackupsEnabled = Boolean(availableProducts?.backups);

  if (!isBackupsEnabled) {
    logger.debug({ msg: 'Backups not available' });
    return;
  }

  const bottleneck = new Bottleneck({ maxConcurrent: 4 });
  const abortController = new AbortController();

  ctx.abortController.signal.addEventListener('abort', () => {
    abortController.abort();
  });

  ipcMain.once('stop-backups-process', () => {
    logger.debug({ tag: 'BACKUPS', msg: 'Backups bottleneck jobs', jobs: bottleneck.counts() });
    void bottleneck.stop({ dropWaitingJobs: true });
    abortController.abort();
    tracker.setStatus('STOPPING');
  });

  tracker.setStatus('RUNNING');

  const suspensionBlockId = powerSaveBlocker.start('prevent-display-sleep');

  const backups = await obtainBackupsInfo();

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
      driveApiBottleneck: ctx.driveApiBottleneck,
      uploadBottleneck: ctx.uploadBottleneck,
      backupsBottleneck: bottleneck,
      client: ctx.client,
      userUuid: user.uuid,
      bucket: user.backupsBucket,
      workspaceId: '',
      workspaceToken: '',
      environment,
      abortController,
      logger: createLogger({ tag: 'BACKUPS' }),
      addIssue: (issue) => {
        addBackupsIssue({
          ...issue,
          folderUuid: backupInfo.folderUuid,
        });
      },
    };

    tracker.backing();

    await executeBackupWorker(context);
  }

  tracker.setStatus('STANDBY');

  tracker.reset();
  electronStore.set('lastBackup', Date.now());
  BackupScheduler.start({ ctx });

  ipcMain.removeAllListeners('stop-backups-process');

  powerSaveBlocker.stop(suspensionBlockId);
}
