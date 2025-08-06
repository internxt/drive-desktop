import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { uploadFile } from '../upload-file';
import { File } from '@/context/virtual-drive/files/domain/File';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { Backup } from '@/apps/backups/Backups';
import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';

type Props = {
  self: Backup;
  context: BackupsContext;
  tracker: BackupsProcessTracker;
  modified: Map<LocalFile, File>;
};

@Service()
export class FileBatchUpdater {
  constructor(private readonly uploader: EnvironmentFileUploader) {}

  async run({ self, context, tracker, modified }: Props) {
    await Promise.all(
      modified.entries().map(([localFile, file]) =>
        this.process({
          self,
          context,
          tracker,
          localFile,
          file,
        }),
      ),
    );
  }

  async process({
    self,
    context,
    tracker,
    localFile,
    file,
  }: {
    self: Backup;
    context: BackupsContext;
    tracker: BackupsProcessTracker;
    localFile: LocalFile;
    file: File;
  }) {
    try {
      const contentsId = await uploadFile({ context, localFile, uploader: this.uploader });

      if (!contentsId) return;

      await driveServerWip.files.replaceFile({
        uuid: file.uuid,
        newContentId: contentsId,
        newSize: localFile.size.value,
        modificationTime: localFile.modificationTime,
      });
    } catch (exc) {
      logger.error({
        tag: 'BACKUPS',
        msg: 'Error updating file',
        path: localFile.relativePath,
        exc,
      });
    } finally {
      self.backed++;
      tracker.currentProcessed(self.backed);
    }
  }
}
