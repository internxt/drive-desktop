import {
  DeleteFileByUuidProps,
  DeleteFolderByUuidProps,
  PersistFileProps,
  PersistFolderProps,
  PersistMoveFileProps,
  PersistMoveFolderProps,
  ReplaceFileProps,
} from './ipc';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { getNameAndExtension } from '@/context/virtual-drive/files/domain/get-name-and-extension';
import { LocalSync } from '@/backend/features';
import { basename } from 'node:path';
import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { createOrUpdateFolder } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { createAndUploadThumbnail } from '@/apps/main/thumbnail/create-and-upload-thumbnail';
import { SqliteError } from '@/infra/sqlite/services/common/sqlite-error';

export async function deleteFileByUuid({ uuid, path, workspaceToken }: DeleteFileByUuidProps) {
  const res = await driveServerWip.storage.deleteFileByUuid({ path, uuid, workspaceToken });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'DELETE_ERROR', path });
  } else {
    LocalSync.SyncState.addItem({ action: 'DELETED', path });
    await SqliteModule.FileModule.updateByUuid({ uuid, payload: { status: 'TRASHED' } });
  }

  return res;
}

export async function deleteFolderByUuid({ uuid, path, workspaceToken }: DeleteFolderByUuidProps) {
  const res = await driveServerWip.storage.deleteFolderByUuid({ path, uuid, workspaceToken });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'DELETE_ERROR', path });
  } else {
    LocalSync.SyncState.addItem({ action: 'DELETED', path });
    await SqliteModule.FolderModule.updateByUuid({ uuid, payload: { status: 'TRASHED' } });
  }

  return res;
}

export async function persistFile({ ctx, path, parentUuid, contentsId, size }: PersistFileProps) {
  const res = await HttpRemoteFileSystem.persist({ ctx, path, parentUuid, contentsId, size });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });
    return res;
  } else {
    LocalSync.SyncState.addItem({ action: 'UPLOADED', path });
    void createAndUploadThumbnail({ ctx, path, fileUuid: res.data.uuid });
    const data = await createOrUpdateFile({ ctx, fileDto: res.data });
    if (data) return { data };
    return { error: new SqliteError('UNKNOWN') };
  }
}

export async function persistFolder({ ctx, parentUuid, path }: PersistFolderProps) {
  const res = await HttpRemoteFolderSystem.persist({ ctx, parentUuid, path });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', path });
    return res;
  } else {
    LocalSync.SyncState.addItem({ action: 'UPLOADED', path });
    const data = await createOrUpdateFolder({ ctx, folderDto: res.data });
    if (data) return { data };
    return { error: new SqliteError('UNKNOWN') };
  }
}

export async function persistReplaceFile({ ctx, path, uuid, size, contentsId, modificationTime }: ReplaceFileProps) {
  const res = await driveServerWip.files.replaceFile({ path, uuid, contentsId, size, modificationTime });

  if (res.error) {
    LocalSync.SyncState.addItem({ action: 'MODIFY_ERROR', path });
    return res;
  } else {
    LocalSync.SyncState.addItem({ action: 'MODIFIED', path });
    const data = await createOrUpdateFile({ ctx, fileDto: res.data });
    if (data) return { data };
    return { error: new SqliteError('UNKNOWN') };
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
