import { Backup } from '@/apps/backups/Backups';
import { BackupsContext } from '../../../../backups/BackupInfo';
import { BackupsProcessTracker } from '../BackupsProcessTracker/BackupsProcessTracker';
import { logger } from '@/apps/shared/logger/logger';

export async function executeBackupWorker(tracker: BackupsProcessTracker, context: BackupsContext) {
  try {
    const backup = new Backup();
    await backup.run({ tracker, context });

    logger.debug({
      tag: 'BACKUPS',
      msg: 'Backup completed',
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
