import { ServerFile } from 'workers/filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../filesystems/domain/ServerFolder';
import { WebdavCustomIpc } from 'workers/webdav/ipc';

export class RemoteItemsGenerator {
  constructor(private readonly ipc: WebdavCustomIpc) {}
  async getAll(): Promise<{ files: ServerFile[]; folders: ServerFolder[] }> {
    const updatedRemoteItems = await this.ipc.invoke(
      'GET_UPDATED_REMOTE_ITEMS'
    );

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
      };
    });

    const folders = updatedRemoteItems.folders.map<ServerFolder>(
      (updatedFolder) => {
        return {
          bucket: updatedFolder.bucket ?? null,
          created_at: updatedFolder.createdAt,
          id: updatedFolder.id,
          name: updatedFolder.name,
          parent_id: updatedFolder.parentId ?? null,
          updated_at: updatedFolder.updatedAt,
          plain_name: updatedFolder.plainName ?? null,
        };
      }
    );

    return { files, folders };
  }
}
