import { RemoteSyncManager } from '../RemoteSyncManager';
import { logger } from '@/apps/shared/logger/logger';
import { FolderStore } from './folder-store';
import { Folder, FolderAttributes } from '@/context/virtual-drive/folders/domain/Folder';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { createOrUpdateFolder } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';

type TProps = {
  self: RemoteSyncManager;
  remoteFolder: FolderDto;
};

export async function syncRemoteFolder({ self, remoteFolder }: TProps) {
  try {
    await createOrUpdateFolder({ context: self.context, folderDto: remoteFolder });

    FolderStore.addFolder({
      workspaceId: self.workspaceId,
      folderId: remoteFolder.id,
      parentId: remoteFolder.parentId,
      parentUuid: remoteFolder.parentUuid,
      plainName: remoteFolder.plainName,
      name: remoteFolder.name,
    });

    if (remoteFolder.status === 'EXISTS' && self.worker.worker) {
      try {
        const plainName = Folder.decryptName({
          name: remoteFolder.name,
          parentId: remoteFolder.parentId,
          plainName: remoteFolder.plainName,
        });

        const { relativePath } = FolderStore.getFolderPath({
          workspaceId: self.workspaceId,
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
