import { PersistMoveFileProps, PersistMoveFolderProps } from './ipc';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { getNameAndExtension } from '@/context/virtual-drive/files/domain/get-name-and-extension';
import { LocalSync } from '@/backend/features';
import { basename } from 'node:path';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { createOrUpdateFolder } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { CommonContext } from '@/apps/sync-engine/config';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

export async function deleteFileByUuid({ ctx, path, uuid }: { ctx: CommonContext; path: AbsolutePath; uuid: FileUuid }) {
  const res = await driveServerWip.storage.deleteFileByUuid({ ctx, context: { path, uuid } });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'DELETE_ERROR', path });
  } else {
    LocalSync.SyncState.addItem({ action: 'DELETED', path });
    await SqliteModule.FileModule.updateByUuid({ uuid, payload: { status: 'TRASHED' } });
  }
}

export async function deleteFolderByUuid({ ctx, path, uuid }: { ctx: CommonContext; path: AbsolutePath; uuid: FolderUuid }) {
  const res = await driveServerWip.storage.deleteFolderByUuid({ ctx, context: { path, uuid } });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'DELETE_ERROR', path });
  } else {
    LocalSync.SyncState.addItem({ action: 'DELETED', path });
    await SqliteModule.FolderModule.updateByUuid({ uuid, payload: { status: 'TRASHED' } });
  }
}

export async function persistMoveFile({ ctx, path, uuid, parentUuid, action }: PersistMoveFileProps) {
  const { name, extension } = getNameAndExtension({ path });
  const res = await driveServerWip.files.move({ ctx, context: { uuid, parentUuid, name, extension } });

  if (res.error) {
    addMoveEvent(false, action, path);
  } else {
    addMoveEvent(true, action, path);
    await createOrUpdateFile({ ctx, fileDto: res.data });
  }
}

export async function persistMoveFolder({ ctx, path, uuid, parentUuid, action }: PersistMoveFolderProps) {
  const name = basename(path);
  const res = await driveServerWip.folders.move({ ctx, context: { uuid, parentUuid, name } });

  if (res.error) {
    addMoveEvent(false, action, path);
  } else {
    addMoveEvent(true, action, path);
    await createOrUpdateFolder({ ctx, folderDto: res.data });
  }
}

function addMoveEvent(success: boolean, action: 'move' | 'rename', path: AbsolutePath) {
  if (success) {
    LocalSync.SyncState.addItem({ action: action === 'move' ? 'MOVE_ERROR' : 'RENAME_ERROR', path });
  } else {
    LocalSync.SyncState.addItem({ action: action === 'move' ? 'MOVED' : 'RENAMED', path });
  }
}
