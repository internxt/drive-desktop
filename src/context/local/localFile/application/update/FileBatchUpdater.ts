import { LocalFile } from '../../domain/LocalFile';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { uploadFile } from '../upload-file';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { Backup } from '@/apps/backups/Backups';
import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { FilesDiff } from '@/apps/backups/diff/calculate-files-diff';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';

type Props = {
  self: Backup;
  context: BackupsContext;
  tracker: BackupsProcessTracker;
  modified: FilesDiff['modified'];
};

export class FileBatchUpdater {
  static async run({ self, context, tracker, modified }: Props) {
    await Promise.all(
      modified.map(async ({ local, remote }) => {
        await this.process({ context, localFile: local, file: remote });
        self.backed++;
        tracker.currentProcessed(self.backed);
      }),
    );
  }

  static async process({ context, localFile, file }: { context: BackupsContext; localFile: LocalFile; file: ExtendedDriveFile }) {
    try {
      const contentsId = await uploadFile({ context, localFile });

      if (!contentsId) return;

      const { data: fileDto } = await driveServerWip.files.replaceFile(
        {
          uuid: file.uuid,
          newContentId: contentsId,
          newSize: localFile.size,
          modificationTime: localFile.modificationTime.toISOString(),
        },
        { abortSignal: context.abortController.signal },
      );

      if (fileDto) {
        await createOrUpdateFile({ context, fileDto });
      }
    } catch (exc) {
      logger.error({
        tag: 'BACKUPS',
        msg: 'Error updating file',
        path: localFile.relativePath,
        exc,
      });
    }
  }
}
