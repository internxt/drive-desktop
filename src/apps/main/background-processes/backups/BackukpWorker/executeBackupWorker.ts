import { Backup } from '@/apps/backups/Backups';
import { BackupsContext } from '../../../../backups/BackupInfo';
import { countBackupUploadIssues } from '../../issues';

export async function executeBackupWorker(ctx: BackupsContext) {
  try {
    await Backup.run({ ctx });

    const failedUploads = countBackupUploadIssues({ folderUuid: ctx.folderUuid });

    if (failedUploads > 0) {
      ctx.logger.warn({ msg: 'Backup completed with failed uploads', folderUuid: ctx.folderUuid, failedUploads });
    } else {
      ctx.logger.debug({ msg: 'Backup completed', folderUuid: ctx.folderUuid });
    }
  } catch (error) {
    ctx.logger.sentryError({ msg: 'Error executing backup folder', error });
  }
}
