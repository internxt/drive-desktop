import { broadcastToWidget } from './windows';
import { getRemoteSyncManager } from './remote-sync/store';
import { ipcMainSyncEngine } from '../sync-engine/ipcMainSyncEngine';

ipcMainSyncEngine.on('CHANGE_SYNC_STATUS', (_, workspaceId, status) => {
  const manager = getRemoteSyncManager({ workspaceId });
  manager?.changeStatus(status);
});

ipcMainSyncEngine.on('FILE_DOWNLOADING', (_, payload) => {
  broadcastToWidget({
    name: 'sync-info-update',
    data: { action: 'DOWNLOADING', name: payload.nameWithExtension, progress: payload.progress, key: payload.key },
  });
});

ipcMainSyncEngine.on('FILE_DOWNLOADED', (_, payload) => {
  broadcastToWidget({
    name: 'sync-info-update',
    data: { action: 'DOWNLOADED', name: payload.nameWithExtension, key: payload.key },
  });
});

ipcMainSyncEngine.on('FILE_DOWNLOAD_CANCEL', (_, payload) => {
  broadcastToWidget({
    name: 'sync-info-update',
    data: { action: 'DOWNLOAD_CANCEL', name: payload.nameWithExtension, key: payload.key },
  });
});

ipcMainSyncEngine.on('FILE_UPLOADING', (_, payload) => {
  broadcastToWidget({
    name: 'sync-info-update',
    data: { action: 'UPLOADING', name: payload.nameWithExtension, progress: payload.progress, key: payload.key },
  });
});

ipcMainSyncEngine.on('FILE_UPLOADED', (_, payload) => {
  broadcastToWidget({
    name: 'sync-info-update',
    data: { action: 'UPLOADED', name: payload.nameWithExtension, key: payload.key },
  });
});

ipcMainSyncEngine.on('FILE_UPLOAD_ERROR', (_, payload) => {
  broadcastToWidget({
    name: 'sync-info-update',
    data: { action: 'UPLOAD_ERROR', name: payload.nameWithExtension, key: payload.key },
  });
});

ipcMainSyncEngine.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  broadcastToWidget({
    name: 'sync-info-update',
    data: { action: 'DOWNLOAD_ERROR', name: payload.nameWithExtension, key: payload.key },
  });
});
