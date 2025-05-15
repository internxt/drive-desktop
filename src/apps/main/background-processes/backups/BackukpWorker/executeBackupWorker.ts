import { ipcMain } from 'electron';
import { BackupsContext } from '../../../../backups/BackupInfo';
import { BackupsProcessTracker, WorkerExitCause } from '../BackupsProcessTracker/BackupsProcessTracker';
import { backupFolder } from '@/apps/backups';
import { DriveDesktopError } from '@/context/shared/domain/errors/DriveDesktopError';
import { logger } from '@/apps/shared/logger/logger';

export async function executeBackupWorker(tracker: BackupsProcessTracker, context: BackupsContext): Promise<WorkerExitCause> {
  const finished = new Promise<WorkerExitCause>(async (resolve) => {
    const promise = backupFolder(tracker, context);

    try {
      context.abortController.signal.addEventListener('abort', () => {
        resolve('forced-by-user');
      });

      const error = await promise;

      if (error) {
        context.abortController.abort();
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
        resolve(error.cause);
      } else {
        resolve('UNKNOWN');
      }
    }
  });

  const reason = await finished;

  return reason;
}
