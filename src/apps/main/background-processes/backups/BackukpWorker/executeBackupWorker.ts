import { BackupsContext } from '../../../../backups/BackupInfo';
import { BackupsProcessTracker } from '../BackupsProcessTracker/BackupsProcessTracker';
import { backupFolder } from '@/apps/backups';
import { logger } from '@/apps/shared/logger/logger';

export async function executeBackupWorker(tracker: BackupsProcessTracker, context: BackupsContext) {
  try {
    await backupFolder(tracker, context);

    logger.debug({
      tag: 'BACKUPS',
      msg: 'Backup finished',
      folderUuid: context.folderUuid,
    });
  } catch (error) {
    logger.error({
      tag: 'BACKUPS',
      msg: 'Error executing backup folder',
      error,
    });
  }
}
