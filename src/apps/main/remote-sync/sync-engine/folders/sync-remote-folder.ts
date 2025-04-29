import { logger } from '@/apps/shared/logger/logger';
import { FolderStore } from './folder-store';
import { Folder, FolderAttributes } from '@/context/virtual-drive/folders/domain/Folder';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { BrowserWindow } from 'electron';
import { driveFoldersCollection } from '../../store';
import { User } from '@/apps/main/types';

type TProps = {
  workspaceId: string;
  user: User;
  remoteFolder: FolderDto;
  browserWindow: BrowserWindow | null;
};

export async function syncRemoteFolder({ workspaceId, user, remoteFolder, browserWindow }: TProps) {
  try {
    await driveFoldersCollection.createOrUpdate({
      ...remoteFolder,
      userUuid: user.uuid,
      workspaceId,
    });

    FolderStore.addFolder({
      workspaceId,
      folderId: remoteFolder.id,
      parentId: remoteFolder.parentId,
      parentUuid: remoteFolder.parentUuid,
      plainName: remoteFolder.plainName,
      name: remoteFolder.name,
    });

    if (remoteFolder.status === 'EXISTS' && browserWindow) {
      try {
        const plainName = Folder.decryptName({
          name: remoteFolder.name,
          parentId: remoteFolder.parentId,
          plainName: remoteFolder.plainName,
        });

        const { relativePath } = FolderStore.getFolderPath({
          workspaceId,
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

        browserWindow.webContents.send('UPDATE_FOLDER_PLACEHOLDER', folderAttributes);
      } catch {}
    }
  } catch (exc) {
    logger.error({
      msg: 'Error creating remote folder in sqlite',
      workspaceId,
      uuid: remoteFolder.uuid,
      exc,
    });
  }
}
