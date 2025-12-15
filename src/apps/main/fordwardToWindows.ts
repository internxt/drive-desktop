import { ipcMainSyncEngine } from '../sync-engine/ipcMainSyncEngine';
import { LocalSync } from '@/backend/features';

ipcMainSyncEngine.on('FILE_DOWNLOADING', (_, payload) => {
  LocalSync.SyncState.addItem({ action: 'DOWNLOADING', path: payload.path, progress: payload.progress });
});

ipcMainSyncEngine.on('FILE_DOWNLOADED', (_, payload) => {
  LocalSync.SyncState.addItem({ action: 'DOWNLOADED', path: payload.path });
});

ipcMainSyncEngine.on('FILE_DOWNLOAD_CANCEL', (_, payload) => {
  LocalSync.SyncState.addItem({ action: 'DOWNLOAD_CANCEL', path: payload.path });
});

ipcMainSyncEngine.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  LocalSync.SyncState.addItem({ action: 'DOWNLOAD_ERROR', path: payload.path });
});
