import { powerSaveBlocker } from 'electron';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { BackupErrorsTracker } from './backup-errors-tracker';
import { BackupProgressTracker } from './backup-progress-tracker';
import { BackupsStopController } from '../../../apps/main/background-processes/backups/BackupsStopController/BackupsStopController';

import { isSyncError } from '../../../shared/issues/SyncErrorCause';
import { backupsConfig } from '.';
import { BackupService } from '../../../apps/backups/BackupService';
import { BackupsDependencyContainerFactory } from '../../../apps/backups/dependency-injection/BackupsDependencyContainerFactory';
import { DriveDesktopError } from '../../../context/shared/domain/errors/DriveDesktopError';

export async function launchBackupProcesses(
  tracker: BackupProgressTracker,
  errors: BackupErrorsTracker,
  stopController: BackupsStopController,
): Promise<void> {
  const suspensionBlockId = powerSaveBlocker.start('prevent-display-sleep');

  const backups = await backupsConfig.obtainBackupsInfo();
  const container = await BackupsDependencyContainerFactory.build();
  const backupService = container.get(BackupService);

  for (const backupInfo of backups) {
    logger.debug({ tag: 'BACKUPS', msg: 'Backup info obtained:', backupInfo });
    if (stopController.hasStopped()) {
      logger.debug({ tag: 'BACKUPS', msg: 'Stop controller stopped' });
      break;
    }

    // eslint-disable-next-line no-await-in-loop
    const result = await backupService.runWithRetry(backupInfo, stopController, tracker);
    if (result.isLeft()) {
      const error = result.getLeft();
      logger.debug({ tag: 'BACKUPS', msg: 'failed', error: error.cause });
      // TODO: Make retryError extend DriveDesktopError to avoid this check
      if (error instanceof DriveDesktopError && 'cause' in error && error.cause && isSyncError(error.cause)) {
        errors.add(backupInfo.folderId, { name: backupInfo.name, error: error.cause });
      }
    }
    logger.debug({ tag: 'BACKUPS', msg: `Backup of folder ${backupInfo.pathname} completed successfully` });
  }
  powerSaveBlocker.stop(suspensionBlockId);
}
