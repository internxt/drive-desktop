import { SyncEngineIpc } from '../../../../apps/sync-engine/SyncEngineIpc';
import {
  ServerFile,
  ServerFileStatus,
} from '../../../shared/domain/ServerFile';
import {
  ServerFolder,
  ServerFolderStatus,
} from '../../../shared/domain/ServerFolder';
import { RemoteItemsGenerator } from '../domain/RemoteItemsGenerator';

export class IpcRemoteItemsGenerator implements RemoteItemsGenerator {
  constructor(private readonly ipc: SyncEngineIpc) {}

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
        plainName: updatedFile.plainName,
        size: updatedFile.size,
        type: updatedFile.type ?? null,
        updatedAt: updatedFile.updatedAt,
        userId: updatedFile.userId,
        status: updatedFile.status as ServerFileStatus,
        uuid: updatedFile.uuid,
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
          uuid: updatedFolder.uuid,
        };
      }
    );

    return { files, folders };
  }
}
