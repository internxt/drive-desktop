import { getConfig } from '@/apps/sync-engine/config';
import { ServerFile, ServerFileStatus } from '../../../shared/domain/ServerFile';
import { ServerFolder, ServerFolderStatus } from '../../../shared/domain/ServerFolder';
import { Service } from 'diod';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

@Service()
export class RemoteItemsGenerator {
  constructor(private readonly ipc = ipcRendererSyncEngine) {}

  async getAll(): Promise<{ files: ServerFile[]; folders: ServerFolder[] }> {
    const updatedRemoteItems = await this.ipc.invoke('GET_UPDATED_REMOTE_ITEMS', getConfig().workspaceId ?? '');

    const files = updatedRemoteItems.files.map((file) => ({
      ...file,
      encrypt_version: '03-aes',
      status: file.status as ServerFileStatus,
    }));

    const folders = updatedRemoteItems.folders.map((folder) => ({
      ...folder,
      bucket: folder.bucket ?? null,
      parentId: folder.parentId ?? null,
      plain_name: folder.plainName ?? null,
      status: folder.status as ServerFolderStatus,
    }));

    return { files, folders };
  }

  async getAllItemsByFolderUuid(folderUuid: string): Promise<{ files: ServerFile[]; folders: ServerFolder[] }> {
    const updatedRemoteItems = await this.ipc.invoke('FORCE_REFRESH_BACKUPS', folderUuid);

    const files = updatedRemoteItems.files.map((file) => ({
      ...file,
      encrypt_version: '03-aes',
      size: Number(file.size),
      status: file.status as ServerFileStatus,
    }));

    const folders = updatedRemoteItems.folders.map((folder) => ({
      ...folder,
      plain_name: folder.plainName ?? null,
      status: folder.status as ServerFolderStatus,
    }));

    return { files, folders };
  }
}
