import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { FromMain, FromProcess } from './ipc';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { broadcastToWidget } from '@/apps/main/windows';
import { getNameAndExtension } from '@/context/virtual-drive/files/domain/get-name-and-extension';

const ipcMainDriveServerWip = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupIpcDriveServerWip() {
  ipcMainDriveServerWip.handle('storageDeleteFileByUuid', async (_, { uuid, workspaceToken, nameWithExtension }) => {
    const res = await driveServerWip.storage.deleteFileByUuid({ uuid, workspaceToken });

    if (res.error) {
      broadcastToWidget({ name: 'sync-info-update', data: { action: 'DELETE_ERROR', name: nameWithExtension, key: uuid } });
    } else {
      broadcastToWidget({ name: 'sync-info-update', data: { action: 'DELETED', name: nameWithExtension, key: uuid } });
      await SqliteModule.FileModule.updateByUuid({ uuid, payload: { status: 'TRASHED' } });
    }

    return res;
  });

  ipcMainDriveServerWip.handle('storageDeleteFolderByUuid', async (_, { uuid, workspaceToken, name }) => {
    const res = await driveServerWip.storage.deleteFolderByUuid({ uuid, workspaceToken });

    if (res.error) {
      broadcastToWidget({ name: 'sync-info-update', data: { action: 'DELETE_ERROR', name, key: uuid } });
    } else {
      broadcastToWidget({ name: 'sync-info-update', data: { action: 'DELETED', name, key: uuid } });
      await SqliteModule.FolderModule.updateByUuid({ uuid, payload: { status: 'TRASHED' } });
    }

    return res;
  });

  ipcMainDriveServerWip.handle('moveFileByUuid', async (_, { uuid, workspaceToken, parentUuid, nameWithExtension }) => {
    const { name, extension } = getNameAndExtension({ nameWithExtension });
    const res = await driveServerWip.files.move({ uuid, parentUuid, name, extension, workspaceToken });

    if (res.error) {
      broadcastToWidget({ name: 'sync-info-update', data: { action: 'MOVE_ERROR', name: nameWithExtension, key: uuid } });
    } else {
      broadcastToWidget({ name: 'sync-info-update', data: { action: 'MOVED', name: nameWithExtension, key: uuid } });
      await SqliteModule.FileModule.updateByUuid({ uuid, payload: { parentUuid, name, extension, status: 'EXISTS' } });
    }

    return res;
  });

  ipcMainDriveServerWip.handle('moveFolderByUuid', async (_, { uuid, workspaceToken, parentUuid, name }) => {
    const res = await driveServerWip.folders.move({ uuid, parentUuid, name, workspaceToken });

    if (res.error) {
      broadcastToWidget({ name: 'sync-info-update', data: { action: 'MOVE_ERROR', name, key: uuid } });
    } else {
      broadcastToWidget({ name: 'sync-info-update', data: { action: 'MOVED', name, key: uuid } });
      await SqliteModule.FolderModule.updateByUuid({ uuid, payload: { parentUuid, name, status: 'EXISTS' } });
    }

    return res;
  });
}
