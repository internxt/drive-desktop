import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { FromMain, FromProcess } from './ipc';
import { SqliteModule } from '../sqlite.module';
import { createAndUploadThumbnail } from '@/apps/main/thumbnails/application/create-and-upload-thumbnail';

const ipcMainSqlite = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupIpcSqlite() {
  ipcMainSqlite.handle('fileGetByName', async (_, props) => {
    return await SqliteModule.FileModule.getByName(props);
  });

  ipcMainSqlite.handle('folderGetByName', async (_, props) => {
    return await SqliteModule.FolderModule.getByName(props);
  });

  ipcMainSqlite.handle('fileGetByUuid', async (_, props) => {
    return await SqliteModule.FileModule.getByUuid(props);
  });

  ipcMainSqlite.handle('folderGetByUuid', async (_, props) => {
    return await SqliteModule.FolderModule.getByUuid(props);
  });

  ipcMainSqlite.handle('fileCreateOrUpdate', async (_, props) => {
    const res = await SqliteModule.FileModule.createOrUpdate(props);

    if (res.data) {
      await createAndUploadThumbnail({
        bucket: props.bucket,
        fileUuid: res.data.uuid,
        absolutePath: props.path,
      });
    }

    return res;
  });

  ipcMainSqlite.handle('fileUpdateByUuid', async (_, props) => {
    return await SqliteModule.FileModule.updateByUuid(props);
  });
}
