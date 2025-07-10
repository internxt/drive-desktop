import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { FromMain, FromProcess } from './ipc';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

const ipcMainDriveServerWip = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupIpcDriveServerWip() {
  void ipcMainDriveServerWip.handle('storageDeleteFileByUuid', async (_, props) => {
    const res = await driveServerWip.storage.deleteFileByUuid(props);

    if (!res.error) {
      await SqliteModule.FileModule.updateByUuid({ uuid: props.uuid, payload: { status: 'TRASHED' } });
    }

    return res;
  });

  void ipcMainDriveServerWip.handle('storageDeleteFolderByUuid', async (_, props) => {
    const res = await driveServerWip.storage.deleteFolderByUuid(props);

    if (!res.error) {
      await SqliteModule.FolderModule.updateByUuid({ uuid: props.uuid, payload: { status: 'TRASHED' } });
    }

    return res;
  });

  void ipcMainDriveServerWip.handle('renameFileByUuid', async (_, props) => {
    const res = await driveServerWip.files.renameFile(props);

    if (!res.error) {
      await SqliteModule.FileModule.updateByUuid({ uuid: props.uuid, payload: { name: props.name } });
    }

    return res;
  });

  void ipcMainDriveServerWip.handle('renameFolderByUuid', async (_, props) => {
    const res = await driveServerWip.folders.renameFolder(props);

    if (!res.error) {
      await SqliteModule.FolderModule.updateByUuid({ uuid: props.uuid, payload: { name: props.plainName } });
    }

    return res;
  });

  void ipcMainDriveServerWip.handle('moveFileByUuid', async (_, props) => {
    const res = await driveServerWip.files.moveFile(props);

    if (!res.error) {
      await SqliteModule.FileModule.updateByUuid({ uuid: props.uuid, payload: { folderUuid: props.parentUuid } });
    }

    return res;
  });

  void ipcMainDriveServerWip.handle('moveFolderByUuid', async (_, props) => {
    const res = await driveServerWip.folders.moveFolder(props);

    if (!res.error) {
      await SqliteModule.FolderModule.updateByUuid({ uuid: props.uuid, payload: { parentUuid: props.parentUuid } });
    }

    return res;
  });
}
