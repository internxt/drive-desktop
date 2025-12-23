import { DeleteFileByUuidProps, DeleteFolderByUuidProps, PersistMoveFileProps, PersistMoveFolderProps } from './ipc';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { getNameAndExtension } from '@/context/virtual-drive/files/domain/get-name-and-extension';
import { LocalSync } from '@/backend/features';
import { basename } from 'node:path';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { createOrUpdateFolder } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';

export async function deleteFileByUuid({ uuid, path, workspaceToken }: DeleteFileByUuidProps) {
  const res = await driveServerWip.storage.deleteFileByUuid({ path, uuid, workspaceToken });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'DELETE_ERROR', path });
  } else {
    LocalSync.SyncState.addItem({ action: 'DELETED', path });
    await SqliteModule.FileModule.updateByUuid({ uuid, payload: { status: 'TRASHED' } });
  }
}

export async function deleteFolderByUuid({ uuid, path, workspaceToken }: DeleteFolderByUuidProps) {
  const res = await driveServerWip.storage.deleteFolderByUuid({ path, uuid, workspaceToken });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'DELETE_ERROR', path });
  } else {
    LocalSync.SyncState.addItem({ action: 'DELETED', path });
    await SqliteModule.FolderModule.updateByUuid({ uuid, payload: { status: 'TRASHED' } });
  }
}

export async function persistMoveFile({ ctx, path, uuid, parentUuid, workspaceToken }: PersistMoveFileProps) {
  const { name, extension } = getNameAndExtension({ path });
  const res = await driveServerWip.files.move({ uuid, parentUuid, name, extension, workspaceToken });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'MOVE_ERROR', path });
  } else {
    LocalSync.SyncState.addItem({ action: 'MOVED', path });
    await createOrUpdateFile({ ctx, fileDto: res.data });
  }
}

export async function persistMoveFolder({ ctx, path, uuid, parentUuid, workspaceToken }: PersistMoveFolderProps) {
  const name = basename(path);
  const res = await driveServerWip.folders.move({ uuid, parentUuid, name, workspaceToken });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'MOVE_ERROR', path });
  } else {
    LocalSync.SyncState.addItem({ action: 'MOVED', path });
    await createOrUpdateFolder({ ctx, folderDto: res.data });
  }
}
