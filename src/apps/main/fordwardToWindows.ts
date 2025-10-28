import { getRemoteSyncManager } from './remote-sync/store';
import { ipcMainSyncEngine } from '../sync-engine/ipcMainSyncEngine';
import { LocalSync } from '@/backend/features';

ipcMainSyncEngine.on('CHANGE_SYNC_STATUS', (_, workspaceId, status) => {
  const manager = getRemoteSyncManager({ workspaceId });
  manager?.changeStatus(status);
});

ipcMainSyncEngine.on('FILE_DOWNLOADING', (_, payload) => {
  LocalSync.SyncState.addItem({ action: 'DOWNLOADING', name: payload.nameWithExtension, progress: payload.progress, key: payload.key });
});

ipcMainSyncEngine.on('FILE_DOWNLOADED', (_, payload) => {
  LocalSync.SyncState.addItem({ action: 'DOWNLOADED', name: payload.nameWithExtension, key: payload.key });
});

ipcMainSyncEngine.on('FILE_DOWNLOAD_CANCEL', (_, payload) => {
  LocalSync.SyncState.addItem({ action: 'DOWNLOAD_CANCEL', name: payload.nameWithExtension, key: payload.key });
});

ipcMainSyncEngine.on('FILE_UPLOADING', (_, payload) => {
  LocalSync.SyncState.addItem({ action: 'UPLOADING', name: payload.nameWithExtension, progress: payload.progress, key: payload.key });
});

ipcMainSyncEngine.on('FILE_UPLOADED', (_, payload) => {
  LocalSync.SyncState.addItem({ action: 'UPLOADED', name: payload.nameWithExtension, key: payload.key });
});

ipcMainSyncEngine.on('FILE_UPLOAD_ERROR', (_, payload) => {
  LocalSync.SyncState.addItem({ action: 'UPLOAD_ERROR', name: payload.nameWithExtension, key: payload.key });
});

ipcMainSyncEngine.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  LocalSync.SyncState.addItem({ action: 'DOWNLOAD_ERROR', name: payload.nameWithExtension, key: payload.key });
});
