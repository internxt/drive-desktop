import Bottleneck from 'bottleneck';
import { ipcMain } from 'electron';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { createLogger, logger } from '@/apps/shared/logger/logger';
import { AuthContext } from '@/apps/sync-engine/config';
import electronStore from '../../config';
import { getBackupsFromDevice } from '../../device/get-backups-from-device';
import { getOrCreateDevice } from '../../device/service';
import { getAvailableProducts } from '../../payments/get-available-products';
import { addBackupsIssue, clearBackupsIssues } from '../issues';
import { executeBackupWorker } from './BackukpWorker/executeBackupWorker';
import { BackupScheduler } from './BackupScheduler/BackupScheduler';
import { tracker } from './BackupsProcessTracker/BackupsProcessTracker';
import { buildBackupsEnvironment } from './build-environment';

type Props = {
  ctx: AuthContext;
};

export async function launchBackupProcesses({ ctx }: Props) {
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

  const { data: device } = await getOrCreateDevice();
  if (!device) return;

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

  const backups = await getBackupsFromDevice(device, true);

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

    const { environment } = buildBackupsEnvironment({ user: ctx.user, device });
    const context: BackupsContext = {
      ...backupInfo,
      ...ctx,
      backupsBottleneck: bottleneck,
      bucket: device.bucket,
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

  logger.debug({
    tag: 'BACKUPS',
    msg: 'Backup finished',
  });
}
