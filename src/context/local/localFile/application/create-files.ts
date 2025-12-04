import { LocalFile } from '../domain/LocalFile';
import { logger } from '@/apps/shared/logger/logger';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { uploadFile } from './upload-file';
import { Backup } from '@/apps/backups/Backups';
import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { createAndUploadThumbnail } from '@/apps/main/thumbnails/application/create-and-upload-thumbnail';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { dirname } from '../infrastructure/AbsolutePath';

type Props = {
  self: Backup;
  context: BackupsContext;
  tracker: BackupsProcessTracker;
  remoteTree: RemoteTree;
  added: LocalFile[];
};

export async function createFiles({ self, context, tracker, remoteTree, added }: Props) {
  await Promise.all(
    added.map(async (localFile) => {
      await createFile({ context, localFile, remoteTree });
      self.backed++;
      tracker.currentProcessed(self.backed);
    }),
  );
}

async function createFile({ context, localFile, remoteTree }: { context: BackupsContext; localFile: LocalFile; remoteTree: RemoteTree }) {
  try {
    const contentsId = await uploadFile({ context, localFile });

    if (!contentsId) return;

    const parentPath = dirname(localFile.absolutePath);
    const parent = remoteTree.folders.get(parentPath);

    if (!parent) return;

    const { data: fileDto } = await HttpRemoteFileSystem.create({
      bucket: context.backupsBucket,
      contentsId,
      folderUuid: parent.uuid,
      path: localFile.absolutePath,
      size: localFile.size,
      workspaceId: '',
    });

    if (fileDto) {
      await Promise.all([
        createOrUpdateFile({ context, fileDto }),
        createAndUploadThumbnail({
          bucket: context.backupsBucket,
          fileUuid: fileDto.uuid,
          absolutePath: localFile.absolutePath,
        }),
      ]);
    }
  } catch (error) {
    logger.error({
      tag: 'BACKUPS',
      msg: 'Error uploading file',
      path: localFile.absolutePath,
      error,
    });
  }
}
