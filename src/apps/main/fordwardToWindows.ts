import { broadcastToWindows } from './windows';
import { getRemoteSyncManager } from './remote-sync/store';
import { ipcMainSyncEngine } from '../sync-engine/ipcMainSyncEngine';
import { onFileCreated } from './on-file-created';

ipcMainSyncEngine.on('CHANGE_SYNC_STATUS', (_, workspaceId, status) => {
  const manager = getRemoteSyncManager({ workspaceId });
  manager?.changeStatus(status);
});

ipcMainSyncEngine.on('FILE_DELETED', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'DELETED', name: payload.nameWithExtension },
  });
});

ipcMainSyncEngine.on('FILE_DOWNLOADING', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'DOWNLOADING', name: payload.nameWithExtension, progress: payload.progress },
  });
});

ipcMainSyncEngine.on('FILE_DOWNLOADED', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'DOWNLOADED', name: payload.nameWithExtension },
  });
});

ipcMainSyncEngine.on('FILE_DOWNLOAD_CANCEL', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'DOWNLOAD_CANCEL', name: payload.nameWithExtension },
  });
});

ipcMainSyncEngine.on('FILE_RENAMING', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'RENAMING', name: payload.nameWithExtension },
  });
});

ipcMainSyncEngine.on('FILE_RENAMED', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'RENAMED', name: payload.nameWithExtension },
  });
});

ipcMainSyncEngine.on('FILE_UPLOADING', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'UPLOADING', name: payload.nameWithExtension, progress: payload.progress },
  });
});

ipcMainSyncEngine.on('FILE_UPLOADED', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'UPLOADED', name: payload.nameWithExtension },
  });
});

ipcMainSyncEngine.on('FILE_UPLOAD_ERROR', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'UPLOAD_ERROR', name: payload.nameWithExtension },
  });
});

ipcMainSyncEngine.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'DOWNLOAD_ERROR', name: payload.nameWithExtension },
  });
});

ipcMainSyncEngine.on('FILE_RENAME_ERROR', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'RENAME_ERROR', name: payload.nameWithExtension },
  });
});

ipcMainSyncEngine.on('FILE_DELETION_ERROR', (_, payload) => {
  broadcastToWindows({
    name: 'sync-info-update',
    data: { action: 'DELETE_ERROR', name: payload.nameWithExtension },
  });
});

ipcMainSyncEngine.on('FILE_CREATED', (_, payload) => onFileCreated(payload));
