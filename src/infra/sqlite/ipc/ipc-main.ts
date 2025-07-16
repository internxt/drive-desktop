import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { FromMain, FromProcess } from './ipc';
import { SqliteModule } from '../sqlite.module';

const ipcMainSqlite = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupIpcSqlite() {
  void ipcMainSqlite.handle('fileGetByName', async (_, props) => {
    return await SqliteModule.FileModule.getByName(props);
  });

  void ipcMainSqlite.handle('folderGetByName', async (_, props) => {
    return await SqliteModule.FolderModule.getByName(props);
  });

  void ipcMainSqlite.handle('fileGetByUuid', async (_, props) => {
    return await SqliteModule.FileModule.getByUuid(props);
  });

  void ipcMainSqlite.handle('folderGetByUuid', async (_, props) => {
    return await SqliteModule.FolderModule.getByUuid(props);
  });

  void ipcMainSqlite.handle('fileCreateOrUpdate', async (_, props) => {
    return await SqliteModule.FileModule.createOrUpdate(props);
  });

  void ipcMainSqlite.handle('folderCreateOrUpdate', async (_, props) => {
    return await SqliteModule.FolderModule.createOrUpdate(props);
  });
}
