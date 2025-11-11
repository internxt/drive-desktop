import { CustomIpc } from '@/apps/shared/IPC/IPCs';
import { ipcMain } from 'electron';
import { CreateFolderProps, DeleteFileByUuidProps, DeleteFolderByUuidProps, FromMain, FromProcess } from './ipc';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { getNameAndExtension } from '@/context/virtual-drive/files/domain/get-name-and-extension';
import { LocalSync } from '@/backend/features';
import { basename } from 'node:path/posix';
import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';

const ipcMainDriveServerWip = ipcMain as unknown as CustomIpc<FromMain, FromProcess>;

export function setupIpcDriveServerWip() {
  ipcMainDriveServerWip.handle('storageDeleteFileByUuid', (_, props) => deleteFileByUuid(props));
  ipcMainDriveServerWip.handle('storageDeleteFolderByUuid', (_, props) => deleteFolderByUuid(props));
  ipcMainDriveServerWip.handle('createFolder', (_, props) => createFolder(props));

  ipcMainDriveServerWip.handle('moveFileByUuid', async (_, { uuid, workspaceToken, parentUuid, path }) => {
    const { name, extension } = getNameAndExtension({ path });
    const res = await driveServerWip.files.move({ uuid, parentUuid, name, extension, workspaceToken });

    if (res.error) {
      LocalSync.SyncState.addItem({ action: 'MOVE_ERROR', path });
    } else {
      LocalSync.SyncState.addItem({ action: 'MOVED', path });
      await SqliteModule.FileModule.updateByUuid({ uuid, payload: { parentUuid, name, extension, status: 'EXISTS' } });
    }

    return res;
  });

  ipcMainDriveServerWip.handle('moveFolderByUuid', async (_, { uuid, workspaceToken, parentUuid, path }) => {
    const name = basename(path);
    const res = await driveServerWip.folders.move({ uuid, parentUuid, name, workspaceToken });

    if (res.error) {
      LocalSync.SyncState.addItem({ action: 'MOVE_ERROR', path });
    } else {
      LocalSync.SyncState.addItem({ action: 'MOVED', path });
      await SqliteModule.FolderModule.updateByUuid({ uuid, payload: { parentUuid, name, status: 'EXISTS' } });
    }

    return res;
  });
}

export async function deleteFileByUuid({ uuid, path, workspaceToken }: DeleteFileByUuidProps) {
  const res = await driveServerWip.storage.deleteFileByUuid({ uuid, workspaceToken });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'DELETE_ERROR', path });
  } else {
    LocalSync.SyncState.addItem({ action: 'DELETED', path });
    await SqliteModule.FileModule.updateByUuid({ uuid, payload: { status: 'TRASHED' } });
  }

  return res;
}

export async function deleteFolderByUuid({ uuid, path, workspaceToken }: DeleteFolderByUuidProps) {
  const res = await driveServerWip.storage.deleteFolderByUuid({ uuid, workspaceToken });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'DELETE_ERROR', path });
  } else {
    LocalSync.SyncState.addItem({ action: 'DELETED', path });
    await SqliteModule.FolderModule.updateByUuid({ uuid, payload: { status: 'TRASHED' } });
  }

  return res;
}

export async function createFolder({ plainName, parentUuid, path, userUuid, workspaceId }: CreateFolderProps) {
  const res = await HttpRemoteFolderSystem.persist({ plainName, parentUuid, path, workspaceId });

  if (res.error) {
    return res;
  }

  return await SqliteModule.FolderModule.createOrUpdate({
    folder: { ...res.data, userUuid, workspaceId },
  });
}
