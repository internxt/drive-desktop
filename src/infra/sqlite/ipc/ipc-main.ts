import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { FromMain, FromProcess } from './ipc';
import { driveFilesCollection, driveFoldersCollection } from '@/apps/main/remote-sync/store';

const ipcMainSQLite = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupIpcSQLite() {
  void ipcMainSQLite.handle('getFile', async (_, props) => {
    return await driveFilesCollection.get(props);
  });

  void ipcMainSQLite.handle('getFolder', async (_, props) => {
    return await driveFoldersCollection.get(props);
  });
}
