import { User } from '../../types';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { driveFoldersCollection } from '../store';
import { logger } from '@/apps/shared/logger/logger';
import { FolderStore } from './folder-store';
import { Folder, FolderAttributes } from '@/context/virtual-drive/folders/domain/Folder';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';

type TProps = {
  self: RemoteSyncManager;
  user: User;
  remoteFolder: FolderDto;
};

export async function syncRemoteFolder({ self, user, remoteFolder }: TProps) {
  try {
    await driveFoldersCollection.createOrUpdate({
      ...remoteFolder,
      userUuid: user.uuid,
      workspaceId: self.workspaceId,
    });

    FolderStore.addFolder({
      workspaceId: self.workspaceId ?? '',
      folderId: remoteFolder.id,
      parentId: remoteFolder.parentId,
      parentUuid: remoteFolder.parentUuid,
      plainName: remoteFolder.plainName,
      name: remoteFolder.name,
    });

    self.totalFoldersSynced++;

    if (remoteFolder.status === 'EXISTS') {
      try {
        const plainName = Folder.decryptName({
          name: remoteFolder.name,
          parentId: remoteFolder.parentId,
          plainName: remoteFolder.plainName,
        });

        const { relativePath } = FolderStore.getFolderPath({
          workspaceId: self.workspaceId ?? '',
          parentId: remoteFolder.parentId,
          parentUuid: remoteFolder.parentUuid,
          plainName,
        });

        const folderAttributes: FolderAttributes = {
          uuid: remoteFolder.uuid,
          id: remoteFolder.id,
          parentId: remoteFolder.parentId,
          parentUuid: remoteFolder.parentUuid,
          createdAt: remoteFolder.createdAt,
          updatedAt: remoteFolder.updatedAt,
          status: remoteFolder.status,
          path: relativePath,
        };

        self.worker.worker?.webContents.send('UPDATE_FOLDER_PLACEHOLDER', folderAttributes);
      } catch {}
    }
  } catch (exc) {
    logger.error({
      msg: 'Error creating remote folder in sqlite',
      workspaceId: self.workspaceId,
      uuid: remoteFolder.uuid,
      exc,
    });
  }
}
