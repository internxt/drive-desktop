import { Backup } from '@/apps/backups/Backups';
import { BackupsContext } from '../../../../backups/BackupInfo';

export async function executeBackupWorker(ctx: BackupsContext) {
  try {
    await Backup.run({ ctx });
    ctx.logger.debug({ msg: 'Backup completed', folderUuid: ctx.folderUuid });
  } catch (error) {
    ctx.logger.error({ msg: 'Error executing backup folder', error });
  }
}
