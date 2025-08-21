import { ipcMain } from 'electron';
import { components } from '../schemas';
import { createFile } from '../drive-server/services/files/services/create-file';
import { moveFile } from '../drive-server/services/files/services/move-file';
import { renameFile } from '../drive-server/services/files/services/rename-file';
import { deleteFileFromStorageByFileId } from '../drive-server/services/files/services/delete-file-content-from-bucket';

ipcMain.handle(
  'create-file',
  async (_, body: components['schemas']['CreateFileDto']) => {
    return await createFile(body);
  }
);

ipcMain.handle(
  'move-file',
  async (_, params: { uuid: string; destinationFolder: string }) => {
    return await moveFile(params);
  }
);

ipcMain.handle(
  'rename-file',
  async (
    _,
    params: { plainName: string; type: string; folderUuid: string }
  ) => {
    return await renameFile(params);
  }
);

ipcMain.handle(
  'delete-file-content',
  async (_, params: { bucketId: string; fileId: string }) => {
    return await deleteFileFromStorageByFileId(params);
  }
);
