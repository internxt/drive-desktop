import { BackupsContext } from '../../../../backups/BackupInfo';
import { BackupsProcessTracker, WorkerExitCause } from '../BackupsProcessTracker/BackupsProcessTracker';
import { backupFolder } from '@/apps/backups';
import { DriveDesktopError } from '@/context/shared/domain/errors/DriveDesktopError';
import { logger } from '@/apps/shared/logger/logger';

export function executeBackupWorker(tracker: BackupsProcessTracker, context: BackupsContext): Promise<WorkerExitCause> {
  const promise = new Promise<WorkerExitCause>(async (resolve) => {
    try {
      context.abortController.signal.addEventListener('abort', () => {
        resolve('forced-by-user');
      });

      await backupFolder(tracker, context);

      resolve('backup-completed');
    } catch (error) {
      logger.error({
        tag: 'BACKUPS',
        msg: 'Error executing backup folder',
        error,
      });

      if (error instanceof DriveDesktopError) {
        resolve(error.cause);
      } else {
        resolve('UNKNOWN');
      }
    }
  });

  return promise;
}
