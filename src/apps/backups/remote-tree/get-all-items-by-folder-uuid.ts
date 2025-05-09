import { ServerFile, ServerFileStatus } from '@/context/shared/domain/ServerFile';
import { ServerFolder, ServerFolderStatus } from '@/context/shared/domain/ServerFolder';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

export async function getAllItemsByFolderUuid(folderUuid: string): Promise<{ files: ServerFile[]; folders: ServerFolder[] }> {
  const updatedRemoteItems = await ipcRendererSyncEngine.invoke('FORCE_REFRESH_BACKUPS', folderUuid);

  const files = updatedRemoteItems.files.map((file) => ({
    ...file,
    encrypt_version: '03-aes',
    size: Number(file.size),
    status: file.status as ServerFileStatus,
  }));

  const folders = updatedRemoteItems.folders.map((folder) => ({
    ...folder,
    status: folder.status as ServerFolderStatus,
    plain_name: folder.plainName ?? null,
  }));

  return { files, folders };
}
