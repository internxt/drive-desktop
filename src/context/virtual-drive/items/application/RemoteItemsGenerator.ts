import { getConfig } from '@/apps/sync-engine/config';
import { ServerFile, ServerFileStatus } from '../../../shared/domain/ServerFile';
import { ServerFolder, ServerFolderStatus } from '../../../shared/domain/ServerFolder';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

export async function getAllItems(): Promise<{ files: ServerFile[]; folders: ServerFolder[] }> {
  const updatedRemoteItems = await ipcRendererSyncEngine.invoke('GET_UPDATED_REMOTE_ITEMS', getConfig().workspaceId ?? '');

  const files = updatedRemoteItems.files.map((file) => ({
    ...file,
    encrypt_version: '03-aes',
    status: file.status as ServerFileStatus,
  }));

  const folders = updatedRemoteItems.folders.map((folder) => ({
    ...folder,
    plain_name: folder.plainName ?? null,
    bucket: folder.bucket ?? null,
    parentId: folder.parentId ?? null,
    status: folder.status as ServerFolderStatus,
  }));

  return { files, folders };
}
