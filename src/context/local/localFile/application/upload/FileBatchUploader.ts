import { LocalFile } from '../../domain/LocalFile';
import { logger } from '@/apps/shared/logger/logger';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { pathUtils } from '../../infrastructure/AbsolutePath';
import { uploadFile } from '../upload-file';
import { Backup } from '@/apps/backups/Backups';
import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { createAndUploadThumbnail } from '@/apps/main/thumbnails/application/create-and-upload-thumbnail';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

type Props = {
  self: Backup;
  context: BackupsContext;
  tracker: BackupsProcessTracker;
  remoteTree: RemoteTree;
  added: LocalFile[];
};

export class FileBatchUploader {
  static async run({ self, context, tracker, remoteTree, added }: Props) {
    const promises = added.map(async (localFile) => {
      try {
        const contentsId = await uploadFile({ context, localFile });

        if (!contentsId) return;

        const parentPath = pathUtils.dirname(localFile.relativePath);
        const parent = remoteTree.folders[parentPath];

        const { data: file, error } = await HttpRemoteFileSystem.create({
          bucket: context.backupsBucket,
          contentsId,
          folderUuid: parent.uuid,
          path: localFile.relativePath,
          size: localFile.size,
          workspaceId: undefined,
        });

        if (error) throw error;

        await createAndUploadThumbnail({
          bucket: context.backupsBucket,
          fileUuid: file.uuid as FileUuid,
          absolutePath: localFile.absolutePath,
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
