import { ipcMain } from 'electron';
import { createFolder } from '../drive-server/services/folder/services/create-folder';
import { moveFolder } from '../drive-server/services/folder/services/move-folder';
import { renameFolder } from '../drive-server/services/folder/services/rename-folder';

ipcMain.handle(
  'create-folder',
  async (_, deviceUuid: string, plainName: string) => {
    return await createFolder(deviceUuid, plainName);
  }
);

ipcMain.handle(
  'move-folder',
  async (_, uuid: string, destinationFolderUuid: string) => {
    return await moveFolder(uuid, destinationFolderUuid);
  }
);

ipcMain.handle(
  'rename-folder',
  async (_, folderUuid: string, newFolderName: string) => {
    return await renameFolder(folderUuid, newFolderName);
  }
);
