import { RemoteSyncManager } from '../RemoteSyncManager';
import { logger } from '@/apps/shared/logger/logger';
import { FileAttributes } from '@/context/virtual-drive/files/domain/File';
import { FolderStore } from '../folders/folder-store';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';

type TProps = {
  self: RemoteSyncManager;
  remoteFile: FileDto;
};

export async function syncRemoteFile({ self, remoteFile }: TProps) {
  try {
    const { data: file, error } = await createOrUpdateFile({ context: self.context, fileDto: remoteFile });

    if (error) throw error;

    if (remoteFile.status === 'EXISTS' && self.worker.worker) {
      try {
        const { relativePath } = FolderStore.getFolderPath({
          workspaceId: self.workspaceId,
          parentId: file.parentId,
          parentUuid: file.parentUuid,
          name: file.nameWithExtension,
        });

        const fileAttributes: FileAttributes = {
          uuid: file.uuid,
          id: file.id,
          contentsId: file.contentsId,
          folderId: file.parentId,
          folderUuid: file.parentUuid,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          status: file.status,
          modificationTime: file.modificationTime,
          size: file.size,
          path: relativePath,
        };

        self.worker.worker.webContents.send('UPDATE_FILE_PLACEHOLDER', fileAttributes);
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
