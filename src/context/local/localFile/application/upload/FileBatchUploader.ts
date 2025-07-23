import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { SimpleFileCreator } from '../../../../virtual-drive/files/application/create/SimpleFileCreator';
import { logger } from '@/apps/shared/logger/logger';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { pathUtils } from '../../infrastructure/AbsolutePath';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { uploadFile } from '../upload-file';
import { onFileCreated } from '@/apps/main/on-file-created';
import { Backup } from '@/apps/backups/Backups';
import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';

type Props = {
  self: Backup;
  context: BackupsContext;
  tracker: BackupsProcessTracker;
  remoteTree: RemoteTree;
  added: LocalFile[];
};

@Service()
export class FileBatchUploader {
  constructor(
    private readonly uploader: EnvironmentFileUploader,
    private readonly creator: SimpleFileCreator,
  ) {}

  async run({ self, context, tracker, remoteTree, added }: Props) {
    const promises = added.map(async (localFile) => {
      try {
        const contentsId = await uploadFile({ context, localFile, uploader: this.uploader });

        if (!contentsId) return;

        const parentPath = pathUtils.dirname(localFile.relativePath);
        const parent = remoteTree.folders[parentPath];

        const file = await this.creator.run({
          contentsId,
          folderUuid: parent.uuid,
          path: localFile.relativePath,
          size: localFile.size.value,
        });

        await onFileCreated({
          bucket: context.backupsBucket,
          name: file.name,
          extension: file.type,
          nameWithExtension: file.nameWithExtension,
          fileId: file.id,
          path: localFile.absolutePath,
        });
      } catch (error) {
        logger.error({
          tag: 'BACKUPS',
          msg: 'Error uploading file',
          path: localFile.relativePath,
          error,
        });
      } finally {
        self.backed++;
        tracker.currentProcessed(self.backed);
      }
    });

    await Promise.all(promises);
  }
}
