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
    const { data: folder, error } = await createOrUpdateFolder({ context: self.context, folderDto: remoteFolder });

    if (error) throw error;

    FolderStore.addFolder({
      workspaceId: self.workspaceId,
      folderId: folder.id,
      parentId: remoteFolder.parentId,
      parentUuid: folder.parentUuid,
      name: folder.name,
    });

    if (folder.status === 'EXISTS' && self.worker.worker) {
      const { relativePath } = FolderStore.getFolderPath({
        workspaceId: self.workspaceId,
        parentId: remoteFolder.parentId,
        parentUuid: folder.parentUuid,
        name: folder.name,
      });

      const folderAttributes: FolderAttributes = {
        uuid: folder.uuid,
        id: folder.id,
        parentId: remoteFolder.parentId,
        parentUuid: folder.parentUuid ?? null,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        status: folder.status,
        path: relativePath,
      };

      self.worker.worker?.webContents.send('UPDATE_FOLDER_PLACEHOLDER', folderAttributes);
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
