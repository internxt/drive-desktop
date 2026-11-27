import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { basename } from 'node:path';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { CommonContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { createOrUpdateFolder } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getNameAndExtension } from '@/context/virtual-drive/files/domain/get-name-and-extension';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { findPlaceholderByUuid } from '@/node-win/watcher/events/find-placeholder-by-uuid';
import { PersistMoveFileProps, PersistMoveFolderProps } from './ipc';

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
    ctx.logger.sentryError({ msg: 'Error deleting folder by uuid', path, error: res.error }, { uuid });
  } else {
    LocalSync.SyncState.addItem({ action: 'DELETED', path });
    await SqliteModule.FolderModule.updateByUuid({ uuid, payload: { status: 'TRASHED' } });
  }
}

export async function persistMoveFile({ ctx, path, uuid, parentUuid, action }: PersistMoveFileProps) {
  const { name, extension } = getNameAndExtension({ path });
  const move = () => driveServerWip.files.move({ ctx, context: { uuid, parentUuid, name, extension } });

  let res = await move();

  if (res.error?.code === 'FILE_ALREADY_EXISTS' && (await trashNameOwnerMissingLocally({ ctx, path, uuid, parentUuid }))) {
    res = await move();
  }

  if (res.error) {
    addMoveEvent(false, action, path);
  } else {
    addMoveEvent(true, action, path);
    await createOrUpdateFile({ ctx, fileDto: res.data });
  }
}

/**
 * v2.7.4 Victor Fernandez
 * Apps like AutoCAD delete the old backup and rename the document to the same backup name within milliseconds, and
 * the deletion is not reported. The old backup then keeps the name in the remote and every later move onto it fails.
 * It is only trashed if this device synced it and no local file keeps its uuid anymore.
 */
async function trashNameOwnerMissingLocally({ ctx, path, uuid, parentUuid }: Omit<PersistMoveFileProps, 'action'>) {
  const { data: owner } = await SqliteModule.FileModule.getByName({ parentUuid, nameWithExtension: basename(path) });
  if (!owner || owner.uuid === uuid) return false;

  const { data: holder, error } = await findPlaceholderByUuid({ folder: dirname(path), uuid: owner.uuid });
  if (holder || error) return false;

  ctx.logger.warn({ msg: 'Trashing remote file missing locally that blocks a move', path, uuid: owner.uuid });
  await deleteFileByUuid({ ctx, path, uuid: owner.uuid });
  return true;
}

export async function persistMoveFolder({ ctx, path, uuid, parentUuid, action }: PersistMoveFolderProps) {
  const name = basename(path);
  const res = await driveServerWip.folders.move({ ctx, context: { uuid, parentUuid, name } });

  if (res.error) {
    addMoveEvent(false, action, path);
    ctx.logger.sentryError({ TAG: 'SYNC-ENGINE', msg: 'Error moving folder', path, error: res.error }, { uuid });
  } else {
    addMoveEvent(true, action, path);
    await createOrUpdateFolder({ ctx, folderDto: res.data });
  }
}

function addMoveEvent(success: boolean, action: 'move' | 'rename', path: AbsolutePath) {
  if (success) {
    LocalSync.SyncState.addItem({ action: action === 'move' ? 'MOVED' : 'RENAMED', path });
  } else {
    LocalSync.SyncState.addItem({ action: action === 'move' ? 'MOVE_ERROR' : 'RENAME_ERROR', path });
  }
}
