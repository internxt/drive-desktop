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
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';

type Props = {
  self: Backup;
  context: BackupsContext;
  tracker: BackupsProcessTracker;
  remoteTree: RemoteTree;
  added: LocalFile[];
};

export class FileBatchUploader {
  static async run({ self, context, tracker, remoteTree, added }: Props) {
    await Promise.all(
      added.map(async (localFile) => {
        await this.process({ context, localFile, remoteTree });
        self.backed++;
        tracker.currentProcessed(self.backed);
      }),
    );
  }

  static async process({ context, remoteTree, localFile }: { context: BackupsContext; remoteTree: RemoteTree; localFile: LocalFile }) {
    try {
      const contentsId = await uploadFile({ context, localFile });

      if (!contentsId) return;

      const parentPath = pathUtils.dirname(localFile.relativePath);
      const parent = remoteTree.folders[parentPath];

      const { data: fileDto } = await HttpRemoteFileSystem.create({
        bucket: context.backupsBucket,
        contentsId,
        folderUuid: parent.uuid,
        path: localFile.relativePath,
        size: localFile.size,
        workspaceId: undefined,
      });

      if (fileDto) {
        await createOrUpdateFile({ context, fileDto });
        await createAndUploadThumbnail({
          bucket: context.backupsBucket,
          fileUuid: fileDto.uuid,
          absolutePath: localFile.absolutePath,
        });
      }
    } catch (error) {
      logger.error({
        tag: 'BACKUPS',
        msg: 'Error uploading file',
        path: localFile.relativePath,
        error,
      });
    }
  }
}
