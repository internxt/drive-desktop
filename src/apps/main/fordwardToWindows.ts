import { broadcastToWindows } from './windows';
import { createAndUploadThumbnail } from './thumbnails/application/create-and-upload-thumbnail';
import configStore from './config';
import path from 'path';
import { isAbsolutePath } from './util';
import { getRemoteSyncManager } from './remote-sync/store';
import { ipcMainSyncEngine } from '../sync-engine/ipcMainSyncEngine';

ipcMainSyncEngine.on('CHANGE_SYNC_STATUS', (_, workspaceId, status) => {
  const manager = getRemoteSyncManager({ workspaceId });
  manager?.changeStatus(status);
});

ipcMainSyncEngine.on('FILE_DELETED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DELETED',
    name: nameWithExtension,
  });
});

ipcMainSyncEngine.on('FILE_DOWNLOADING', (_, payload) => {
  const { nameWithExtension, progress } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DOWNLOADING',
    name: nameWithExtension,
    progress,
  });
});

ipcMainSyncEngine.on('FILE_DOWNLOADED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DOWNLOADED',
    name: nameWithExtension,
  });
});

ipcMainSyncEngine.on('FILE_DOWNLOAD_CANCEL', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DOWNLOAD_CANCEL',
    name: nameWithExtension,
  });
});

ipcMainSyncEngine.on('FILE_MOVED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'MOVED',
    name: nameWithExtension,
  });
});

ipcMainSyncEngine.on('FILE_RENAMING', (_, payload) => {
  const { nameWithExtension, oldName } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'RENAMING',
    name: nameWithExtension,
    oldName,
  });
});

ipcMainSyncEngine.on('FILE_RENAMED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'RENAMED',
    name: nameWithExtension,
  });
});

ipcMainSyncEngine.on('FILE_UPLOADING', (_, payload) => {
  const { nameWithExtension, progress } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'UPLOADING',
    name: nameWithExtension,
    progress,
  });
});

ipcMainSyncEngine.on('FILE_UPLOADED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'UPLOADED',
    name: nameWithExtension,
  });
});

export async function onFileCreated(payload: {
  bucket: string;
  name: string;
  extension: string;
  nameWithExtension: string;
  fileId: number;
  path: string;
}) {
  const { bucket, nameWithExtension, fileId } = payload;

  let fullPath = payload.path;

  if (!isAbsolutePath(fullPath)) {
    const root = configStore.get('syncRoot');
    fullPath = path.join(root, fullPath);
  }

  await createAndUploadThumbnail(bucket, fileId, nameWithExtension, fullPath);

  broadcastToWindows('sync-info-update', {
    action: 'UPLOADED',
    name: nameWithExtension,
  });
}

ipcMainSyncEngine.on('FILE_CREATED', (_, payload) => onFileCreated(payload));

ipcMainSyncEngine.on('FILE_UPLOAD_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'UPLOAD_ERROR',
    name: nameWithExtension,
  });
});

ipcMainSyncEngine.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DOWNLOAD_ERROR',
    name: nameWithExtension,
  });
});

ipcMainSyncEngine.on('FILE_RENAME_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'RENAME_ERROR',
    name: nameWithExtension,
  });
});

ipcMainSyncEngine.on('FILE_DELETION_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DELETE_ERROR',
    name: nameWithExtension,
  });
});
