import { Folder, FolderAttributesWithoutPath } from '@/context/virtual-drive/folders/domain/Folder';
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
    const plainName = Folder.decryptName({
      plainName: driveFolder.plainName,
      name: driveFolder.name,
      parentId: driveFolder.parentId,
    });

    const folderAttributes: FolderAttributesWithoutPath = {
      createdAt: driveFolder.createdAt,
      uuid: driveFolder.uuid,
      parentId: driveFolder.parentId ?? null,
      parentUuid: driveFolder.parentUuid ?? null,
      id: driveFolder.id,
      status: driveFolder.status,
      updatedAt: driveFolder.updatedAt,
      plainName,
    };

    if (remoteFolder.status === 'EXISTS') {
      // self.worker.worker?.webContents.send('UPDATE_FOLDER_PLACEHOLDER', folderAttributes);
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
