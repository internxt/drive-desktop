import { Backup } from '@/apps/backups/Backups';
import { BackupsContext } from '../../../../backups/BackupInfo';
import { BackupsProcessTracker } from '../BackupsProcessTracker/BackupsProcessTracker';

export async function executeBackupWorker(tracker: BackupsProcessTracker, ctx: BackupsContext) {
  try {
    const backup = new Backup();
    await backup.run({ tracker, ctx });

    ctx.logger.debug({ msg: 'Backup completed', folderUuid: ctx.folderUuid });
  } catch (error) {
    ctx.logger.error({ msg: 'Error executing backup folder', error });
  }
}
