import { logger } from '@/apps/shared/logger/logger';
import { File, FileAttributes } from '@/context/virtual-drive/files/domain/File';
import { FolderStore } from '../folders/folder-store';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { BrowserWindow } from 'electron';
import { driveFilesCollection } from '../../store';
import { User } from '@/apps/main/types';

type TProps = {
  workspaceId: string;
  user: User;
  remoteFile: FileDto;
  browserWindow: BrowserWindow | null;
};

export async function syncRemoteFile({ workspaceId, user, remoteFile, browserWindow }: TProps) {
  try {
    const driveFile = await driveFilesCollection.createOrUpdate({
      ...remoteFile,
      size: Number(remoteFile.size),
      isDangledStatus: false,
      userUuid: user.uuid,
      workspaceId,
    });

    if (remoteFile.status === 'EXISTS' && browserWindow) {
      try {
        const plainName = File.decryptName({
          name: driveFile.name,
          parentId: driveFile.folderId,
          type: driveFile.type,
          plainName: driveFile.plainName,
        });

        const { relativePath } = FolderStore.getFolderPath({
          workspaceId,
          parentId: driveFile.folderId,
          parentUuid: driveFile.folderUuid ?? null,
          plainName,
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

        browserWindow.webContents.send('UPDATE_FILE_PLACEHOLDER', fileAttributes);
      } catch {}
    }
  } catch (exc) {
    logger.error({
      msg: 'Error creating remote file in sqlite',
      workspaceId,
      uuid: remoteFile.uuid,
      exc,
    });
  }
}
