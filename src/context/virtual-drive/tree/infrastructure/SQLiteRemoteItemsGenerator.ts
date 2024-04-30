import { Service } from 'diod';
import { getUpdatedRemoteItems } from '../../../../apps/main/remote-sync/service';
import {
  ServerFile,
  ServerFileStatus,
} from '../../../shared/domain/ServerFile';
import {
  ServerFolder,
  ServerFolderStatus,
} from '../../../shared/domain/ServerFolder';
import { RemoteItemsGenerator } from '../domain/RemoteItemsGenerator';

@Service()
export class SQLiteRemoteItemsGenerator implements RemoteItemsGenerator {
  async getAll(): Promise<{ files: ServerFile[]; folders: ServerFolder[] }> {
    const result = await getUpdatedRemoteItems();

    const files = result.files.map<ServerFile>((updatedFile) => {
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

    const folders = result.folders.map<ServerFolder>((updatedFolder) => {
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
    });

    return { files, folders };
  }
}
