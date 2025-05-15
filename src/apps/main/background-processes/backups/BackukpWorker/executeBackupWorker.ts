import { ipcMain } from 'electron';
import { BackupsContext } from '../../../../backups/BackupInfo';
import { BackupsStopController } from '../BackupsStopController/BackupsStopController';
import { BackupsProcessTracker, WorkerExitCause } from '../BackupsProcessTracker/BackupsProcessTracker';
import { backupFolder } from '@/apps/backups';
import { DriveDesktopError } from '@/context/shared/domain/errors/DriveDesktopError';
import { logger } from '@/apps/shared/logger/logger';

export async function executeBackupWorker(
  tracker: BackupsProcessTracker,
  context: BackupsContext,
  stopController: BackupsStopController,
): Promise<WorkerExitCause> {
  const finished = new Promise<WorkerExitCause>(async (resolve) => {
    const promise = backupFolder(tracker, context);

    try {
      stopController.on('forced-by-user', () => {
        context.abortController.abort();
        resolve('forced-by-user');
      });

      const error = await promise;

      if (error) {
        stopController.failed(error.cause);
        resolve(error.cause);
      }

      ipcMain.emit('BACKUP_COMPLETED', context.folderId);
      resolve('backup-completed');
    } catch (error) {
      logger.error({
        tag: 'BACKUPS',
        msg: 'Error executing backup folder',
        error,
      });

      if (error instanceof DriveDesktopError) {
        stopController.failed(error.cause);
        resolve(error.cause);
      } else {
        stopController.failed('UNKNOWN');
        resolve('UNKNOWN');
      }
    }
  });

  const reason = await finished;

  return reason;
}
