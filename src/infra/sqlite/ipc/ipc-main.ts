import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { FromMain, FromProcess } from './ipc';
import { SqliteModule } from '../sqlite.module';

const ipcMainSqlite = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupIpcSqlite() {
  ipcMainSqlite.handle('fileGetByUuid', async (_, props) => {
    return await SqliteModule.FileModule.getByUuid(props);
  });

  ipcMainSqlite.handle('fileUpdateByUuid', async (_, props) => {
    return await SqliteModule.FileModule.updateByUuid(props);
  });
}
