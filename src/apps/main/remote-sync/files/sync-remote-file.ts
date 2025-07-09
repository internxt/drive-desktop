import { RemoteSyncManager } from '../RemoteSyncManager';
import { logger } from '@/apps/shared/logger/logger';
import { FileAttributes } from '@/context/virtual-drive/files/domain/File';
import { FolderStore } from '../folders/folder-store';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { fileDecryptName } from '@/context/virtual-drive/files/domain/file-decrypt-name';

type TProps = {
  self: RemoteSyncManager;
  remoteFile: FileDto;
};

export async function syncRemoteFile({ self, remoteFile }: TProps) {
  try {
    const driveFile = await createOrUpdateFile({ context: self.context, fileDto: remoteFile });

    if (remoteFile.status === 'EXISTS' && self.worker.worker) {
      try {
        const { nameWithExtension } = fileDecryptName({
          encryptedName: driveFile.name,
          parentId: driveFile.folderId,
          extension: driveFile.type,
          plainName: driveFile.plainName,
        });

        const { relativePath } = FolderStore.getFolderPath({
          workspaceId: self.workspaceId,
          parentId: driveFile.folderId,
          parentUuid: driveFile.folderUuid ?? null,
          plainName: nameWithExtension,
        });

        const fileAttributes: FileAttributes = {
          uuid: driveFile.uuid,
          id: driveFile.id,
          contentsId: driveFile.fileId,
          folderId: driveFile.folderId,
          folderUuid: driveFile.folderUuid,
          createdAt: driveFile.createdAt,
          updatedAt: driveFile.updatedAt,
          status: driveFile.status,
          modificationTime: driveFile.modificationTime,
          size: driveFile.size,
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
