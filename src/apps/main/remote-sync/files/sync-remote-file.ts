import { User } from '../../types';
import { RemoteSyncedFile } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { driveFilesCollection } from '../store';
import { logger } from '@/apps/shared/logger/logger';
import { File, FileAttributes } from '@/context/virtual-drive/files/domain/File';
import { FolderStore } from '../folders/folder-store';

type TProps = {
  self: RemoteSyncManager;
  user: User;
  remoteFile: RemoteSyncedFile;
};

export async function syncRemoteFile({ self, user, remoteFile }: TProps) {
  try {
    await driveFilesCollection.createOrUpdate({
      ...remoteFile,
      isDangledStatus: false,
      userUuid: user.uuid,
      workspaceId: self.workspaceId,
    });

    self.totalFilesSynced++;

    if (remoteFile.status === 'EXISTS') {
      try {
        const plainName = File.decryptName({
          name: remoteFile.name,
          parentId: remoteFile.folderId,
          type: remoteFile.type,
          plainName: remoteFile.plainName,
        });

        const { relativePath } = FolderStore.getFolderPath({
          workspaceId: self.workspaceId ?? '',
          parentId: remoteFile.folderId,
          parentUuid: remoteFile.folderUuid,
          plainName,
        });

        const fileAttributes: FileAttributes = {
          uuid: remoteFile.uuid,
          id: remoteFile.id,
          contentsId: remoteFile.fileId,
          folderId: remoteFile.folderId,
          createdAt: remoteFile.createdAt,
          updatedAt: remoteFile.updatedAt,
          status: remoteFile.status,
          modificationTime: remoteFile.modificationTime,
          size: remoteFile.size,
          path: relativePath,
        };

        self.worker.worker?.webContents.send('UPDATE_FILE_PLACEHOLDER', fileAttributes);
      } catch {}
    }
  } catch (exc) {
    logger.error({
      msg: 'Error creating remote file in sqlite',
      workspaceId: self.workspaceId,
      uuid: remoteFile.uuid,
      exc,
    });
  }
}
