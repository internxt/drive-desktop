import Logger from 'electron-log';
import { broadcastToWindows } from './windows';
import { ipcMainDrive } from './ipcs/mainDrive';
import { ipcMainSyncEngine } from './ipcs/ipcMainSyncEngine';
import { FileErrorInfo } from '../shared/IPC/events/drive';
import { setIsProcessing } from './remote-sync/handlers';
import { createAndUploadThumbnail } from './thumbnails/application/create-and-upload-thumbnail';
import configStore from './config';
import path from 'path';
import { isAbsolutePath } from './util';

ipcMainDrive.on('FILE_DELETED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DELETED',
    name: nameWithExtension,
  });
});

ipcMainDrive.on('FILE_DOWNLOADING', (_, payload) => {
  const { nameWithExtension, processInfo } = payload;
  setIsProcessing(true);
  broadcastToWindows('sync-info-update', {
    action: 'DOWNLOADING',
    name: nameWithExtension,
    progress: processInfo.progress,
  });
});

ipcMainDrive.on('SYNCING', () => {
  setIsProcessing(true);
});

ipcMainDrive.on('SYNCED', () => {
  setIsProcessing(false);
});

ipcMainDrive.on('FILE_PREPARING', (_, payload) => {
  const { nameWithExtension, processInfo } = payload;
  setIsProcessing(true);
  broadcastToWindows('sync-info-update', {
    action: 'PREPARING',
    name: nameWithExtension,
    progress: processInfo.progress,
  });
});

ipcMainDrive.on('FILE_DOWNLOADED', (_, payload) => {
  setIsProcessing(false);
  const { nameWithExtension } = payload;
  broadcastToWindows('sync-info-update', {
    action: 'DOWNLOADED',
    name: nameWithExtension,
  });
});
ipcMainDrive.on('FILE_DOWNLOAD_CANCEL', (_, payload) => {
  setIsProcessing(false);
  const { nameWithExtension } = payload;
  broadcastToWindows('sync-info-update', {
    action: 'DOWNLOAD_CANCEL',
    name: nameWithExtension,
  });
});

ipcMainDrive.on('FILE_MOVED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'MOVED',
    name: nameWithExtension,
  });
});

ipcMainDrive.on('FILE_OVERWRITED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'MOVED',
    name: nameWithExtension,
  });
});

ipcMainDrive.on('FILE_RENAMING', (_, payload) => {
  const { nameWithExtension, oldName } = payload;
  setIsProcessing(true);
  broadcastToWindows('sync-info-update', {
    action: 'RENAMING',
    name: nameWithExtension,
    oldName,
  });
});

ipcMainDrive.on('FILE_RENAMED', (_, payload) => {
  const { nameWithExtension } = payload;
  setIsProcessing(false);
  broadcastToWindows('sync-info-update', {
    action: 'RENAMED',
    name: nameWithExtension,
  });
});

ipcMainDrive.on('FILE_CLONNED', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'UPLOADED',
    name: nameWithExtension,
  });
});

ipcMainDrive.on('FILE_UPLOADING', (_, payload) => {
  const { nameWithExtension, processInfo } = payload;
  broadcastToWindows('sync-info-update', {
    action: 'UPLOADING',
    name: nameWithExtension,
    progress: processInfo.progress,
  });
});

ipcMainDrive.on('FILE_UPLOADED', async (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'UPLOADED',
    name: nameWithExtension,
  });
});

ipcMainDrive.on('FILE_CREATED', async (_, payload) => {
  Logger.info('FILE_CREATED');
  const { nameWithExtension, fileId } = payload;

  let fullPath = payload.path;

  if (!isAbsolutePath(fullPath)) {
    const root = configStore.get('syncRoot');
    Logger.info('FILE_CREATED', root);
    fullPath = path.join(root, fullPath);
  }

  Logger.info('FILE_CREATED', fullPath);

  await createAndUploadThumbnail(fileId, nameWithExtension, fullPath);

  broadcastToWindows('sync-info-update', {
    action: 'UPLOADED',
    name: nameWithExtension,
  });
});

ipcMainDrive.on('FILE_UPLOAD_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'UPLOAD_ERROR',
    name: nameWithExtension,
  });
});

ipcMainDrive.on('FILE_DOWNLOAD_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DOWNLOAD_ERROR',
    name: nameWithExtension,
  });
});

ipcMainDrive.on('FILE_RENAME_ERROR', (_, payload) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'RENAME_ERROR',
    name: nameWithExtension,
  });
});

ipcMainDrive.on('FILE_DELETION_ERROR', (_, payload: FileErrorInfo) => {
  const { nameWithExtension } = payload;

  broadcastToWindows('sync-info-update', {
    action: 'DELETE_ERROR',
    name: nameWithExtension,
  });
});

ipcMainSyncEngine.on('SYNC_PROBLEM', (_, payload) => {
  broadcastToWindows('sync-info-update', {
    action: 'SYNC_PROBLEM',
    name: payload.additionalData.name,
  });
});
