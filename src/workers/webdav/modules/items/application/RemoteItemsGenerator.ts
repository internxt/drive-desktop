import {
  ServerFile,
  ServerFileStatus,
} from '../../../../filesystems/domain/ServerFile';
import {
  ServerFolder,
  ServerFolderStatus,
} from '../../../../filesystems/domain/ServerFolder';
import { getUpdtaedRemoteItems } from '../../../../../main/remote-sync/handlers';

export class RemoteItemsGenerator {
  async getAll(): Promise<{ files: ServerFile[]; folders: ServerFolder[] }> {
    const updatedRemoteItems = await getUpdtaedRemoteItems();

    const files = updatedRemoteItems.files.map<ServerFile>((updatedFile) => {
      return {
        bucket: updatedFile.bucket,
        createdAt: updatedFile.createdAt,
        encrypt_version: '03-aes',
        fileId: updatedFile.fileId,
        folderId: updatedFile.folderId,
        id: updatedFile.id,
        modificationTime: updatedFile.modificationTime,
        name: updatedFile.name,
        size: updatedFile.size,
        type: updatedFile.type ?? null,
        updatedAt: updatedFile.updatedAt,
        userId: updatedFile.userId,
        status: updatedFile.status as ServerFileStatus,
      };
    });

    const folders = updatedRemoteItems.folders.map<ServerFolder>(
      (updatedFolder) => {
        return {
          bucket: updatedFolder.bucket ?? null,
          createdAt: updatedFolder.createdAt,
          id: updatedFolder.id,
          name: updatedFolder.name,
          parentId: updatedFolder.parentId ?? null,
          updatedAt: updatedFolder.updatedAt,
          plain_name: updatedFolder.plainName ?? null,
          status: updatedFolder.status as ServerFolderStatus,
        };
      }
    );

    return { files, folders };
  }
}
