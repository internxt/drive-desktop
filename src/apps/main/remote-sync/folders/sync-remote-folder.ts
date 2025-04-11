import { FolderAttributes } from '@/context/virtual-drive/folders/domain/Folder';
import { User } from '../../types';
import { RemoteSyncedFolder } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { driveFoldersCollection } from '../store';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  self: RemoteSyncManager;
  user: User;
  remoteFolder: RemoteSyncedFolder;
};

export async function syncRemoteFolder({ self, user, remoteFolder }: TProps) {
  const driveFolder = await driveFoldersCollection.createOrUpdate({
    ...remoteFolder,
    userUuid: user.uuid,
    workspaceId: self.workspaceId,
  });

  self.totalFoldersSynced++;

  try {
    let path = await driveFoldersCollection.getRelativePath(driveFolder.parentUuid!);
    path = path + '/' + driveFolder.plainName;

    const fileAttributes: FolderAttributes = {
      createdAt: driveFolder.createdAt,
      uuid: driveFolder.uuid,
      parentId: driveFolder.parentId!,
      parentUuid: driveFolder.parentUuid!,
      id: driveFolder.id,
      status: driveFolder.status,
      updatedAt: driveFolder.updatedAt,
      path,
    };

    if (remoteFolder.status === 'EXISTS') {
      self.worker.worker?.webContents.send('UPDATE_FOLDER_PLACEHOLDER', fileAttributes);
    }
  } catch (exc) {
    logger.error({
      msg: 'Error creating folder placeholder',
      workspaceId: self.workspaceId,
      uuid: driveFolder.uuid,
      exc,
    });
  }
}
