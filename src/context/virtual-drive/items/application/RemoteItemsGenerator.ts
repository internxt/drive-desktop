import { getConfig } from '@/apps/sync-engine/config';
import { DriveFile } from '../../../../apps/main/database/entities/DriveFile';
import { DriveFolder } from '../../../../apps/main/database/entities/DriveFolder';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { ServerFile, ServerFileStatus } from '../../../shared/domain/ServerFile';
import { ServerFolder, ServerFolderStatus } from '../../../shared/domain/ServerFolder';
import { Service } from 'diod';

@Service()
export class RemoteItemsGenerator {
  constructor(private readonly ipc: SyncEngineIpc) {}

  private mapFile(updatedFile: DriveFile): ServerFile {
    return {
      bucket: updatedFile.bucket,
      createdAt: updatedFile.createdAt,
      encrypt_version: '03-aes',
      fileId: updatedFile.fileId,
      folderId: updatedFile.folderId,
      folderUuid: updatedFile.folderUuid,
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
  }

  private mapFolder(updatedFolder: DriveFolder): ServerFolder {
    return {
      bucket: updatedFolder.bucket ?? null,
      createdAt: updatedFolder.createdAt,
      id: updatedFolder.id,
      name: updatedFolder.name,
      parentId: updatedFolder.parentId ?? null,
      parentUuid: updatedFolder.parentUuid,
      updatedAt: updatedFolder.updatedAt,
      plain_name: updatedFolder.plainName ?? null,
      status: updatedFolder.status as ServerFolderStatus,
      uuid: updatedFolder.uuid,
      removed: updatedFolder.status === 'REMOVED',
    };
  }

  async getAll(): Promise<{ files: ServerFile[]; folders: ServerFolder[] }> {
    const updatedRemoteItems = await this.ipc.invoke('GET_UPDATED_REMOTE_ITEMS', getConfig().workspaceId ?? '');

    const files = updatedRemoteItems.files.map<ServerFile>(this.mapFile);

    const folders = updatedRemoteItems.folders.map<ServerFolder>(this.mapFolder);

    return { files, folders };
  }

  async getAllItemsByFolderUuid(folderUuid: string): Promise<{ files: ServerFile[]; folders: ServerFolder[] }> {
    const updatedRemoteItems = await this.ipc.invoke('GET_UPDATED_REMOTE_ITEMS_BY_FOLDER', folderUuid, getConfig().workspaceId ?? '');

    const files = updatedRemoteItems.files.map<ServerFile>(this.mapFile);

    const folders = updatedRemoteItems.folders.map<ServerFolder>(this.mapFolder);

    return { files, folders };
  }

  async forceRefresh(folderUuid: string): Promise<void> {
    await this.ipc.invoke('FORCE_REFRESH_BACKUPS', folderUuid);
  }
}
