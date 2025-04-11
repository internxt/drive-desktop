import { FileAttributes } from '@/context/virtual-drive/files/domain/File';
import { User } from '../../types';
import { RemoteSyncedFile } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { driveFilesCollection, driveFoldersCollection } from '../store';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  self: RemoteSyncManager;
  user: User;
  remoteFile: RemoteSyncedFile;
};

export async function syncRemoteFile({ self, user, remoteFile }: TProps) {
  const driveFile = await driveFilesCollection.createOrUpdate({
    ...remoteFile,
    isDangledStatus: false,
    userUuid: user.uuid,
    workspaceId: self.workspaceId,
  });

  self.totalFilesSynced++;

  try {
    let path = await driveFoldersCollection.getRelativePath(driveFile.folderUuid);
    path = path + '/' + driveFile.plainName;
    if (driveFile.type) path = path + '.' + driveFile.type;

    const fileAttributes: FileAttributes = {
      contentsId: driveFile.fileId,
      createdAt: driveFile.createdAt,
      uuid: driveFile.uuid,
      folderId: driveFile.folderId,
      folderUuid: driveFile.folderUuid,
      id: driveFile.id,
      modificationTime: driveFile.modificationTime,
      status: driveFile.status,
      size: driveFile.size,
      updatedAt: driveFile.updatedAt,
      path,
    };

    if (remoteFile.status === 'EXISTS') {
      self.worker.worker?.webContents.send('UPDATE_FILE_PLACEHOLDER', fileAttributes);
    }
  } catch (exc) {
    logger.error({
      msg: 'Error creating file placeholder',
      workspaceId: self.workspaceId,
      uuid: driveFile.uuid,
      exc,
    });
  }
}
