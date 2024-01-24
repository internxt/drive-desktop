import { broadcastToWindows } from './windows';
import { MainProcessSyncEngineIPC } from './MainProcessSyncEngineIPC';

MainProcessSyncEngineIPC.on('FILE_DELETED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DELETED',
    name: nameWithExtension,
  });
});

MainProcessSyncEngineIPC.on('FILE_DOWNLOADING', (_, payload) => {
  const { nameWithExtension, processInfo } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DOWNLOADING',
    name: nameWithExtension,
    progress: processInfo.progress,
  });
});

MainProcessSyncEngineIPC.on('FILE_DOWNLOADED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DOWNLOADED',
    name: nameWithExtension,
  });
});

MainProcessSyncEngineIPC.on('FILE_MOVED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'MOVED',
    name: nameWithExtension,
  });
});

MainProcessSyncEngineIPC.on('FILE_RENAMING', (_, payload) => {
  const { nameWithExtension, oldName } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'RENAMING',
    name: nameWithExtension,
    oldName,
  });
});

MainProcessSyncEngineIPC.on('FILE_RENAMED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'RENAMED',
    name: nameWithExtension,
  });
});

MainProcessSyncEngineIPC.on('FILE_UPLOADING', (_, payload) => {
  const { nameWithExtension, processInfo } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'UPLOADING',
    name: nameWithExtension,
    progress: processInfo.progress,
  });
});

MainProcessSyncEngineIPC.on('FILE_CREATED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'UPLOADED',
    name: nameWithExtension,
  });
});

MainProcessSyncEngineIPC.on('FILE_UPLOAD_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-error', {
    action: 'UPLOAD_ERROR',
    name: nameWithExtension,
  });
});

MainProcessSyncEngineIPC.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-error', {
    action: 'DOWNLOAD_ERROR',
    name: nameWithExtension,
  });
});

MainProcessSyncEngineIPC.on('FILE_RENAME_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-error', {
    action: 'RENAME_ERROR',
    name: nameWithExtension,
  });
});

MainProcessSyncEngineIPC.on('FILE_DELETION_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-error', {
    action: 'DELETE_ERROR',
    name: nameWithExtension,
  });
});
