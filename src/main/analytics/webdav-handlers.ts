import Logger from 'electron-log';
import { ipcWebdav, IpcWebdavFlow, IpcWebdavFlowErrors } from '../ipcs/webdav';
import { trackWebdavError, trackWebdavEvent } from './service';
import { WebdavErrorContext } from '../../shared/IPC/events/webdav';
import { broadcastToWindows } from '../windows';
import { VirtualDriveStatus } from '../../workers/webdav/VirtualDrive';
import { ipcMain } from 'electron';

function subscribeToFlowEvents(ipc: IpcWebdavFlow) {
  ipc.on('WEBDAV_FILE_DELETED', (_, payload) => {
    const { name, type, size } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'DELETED',
      name: name + '.' + type,
    });

    trackWebdavEvent('Delete', {
      name,
      type,
      size,
    });
  });

  ipc.on('WEBDAV_FILE_DOWNLOADING', (_, payload) => {
    const { name, type, progress } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOADING',
      name: name + '.' + type,
      progress,
    });
  });

  ipc.on('WEBDAV_FILE_DOWNLOADED', (_, payload) => {
    const { name, type, size, processInfo } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOADED',
      name: name + '.' + type,
    });

    trackWebdavEvent('Upload', {
      name,
      type,
      size,
      elapsedTime: processInfo?.elapsedTime,
    });
  });

  ipc.on('WEBDAV_FILE_MOVED', (_, payload) => {
    const { name, folderName } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'MOVED',
      name,
    });

    trackWebdavEvent('Move', {
      name,
      folderName,
    });
  });

  ipc.on('WEBDAV_FILE_OVERWRITED', (_, payload) => {
    const { name } = payload;

    trackWebdavEvent('Move', {
      name,
    });
  });

  ipc.on('WEBDAV_FILE_RENAMED', (_, payload) => {
    const { name } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'RENAMED',
      name,
    });

    trackWebdavEvent('Rename', {
      name,
    });
  });

  ipc.on('WEBDAV_FILE_CLONNED', (_, payload) => {
    const { name, type, size, processInfo } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'UPLOADED',
      name,
    });

    trackWebdavEvent('Upload', {
      name,
      type,
      size,
      clonned: true,
      elapsedTime: processInfo?.elapsedTime,
    });
  });

  ipc.on('WEBDAV_FILE_UPLOADED', (_, payload) => {
    const { name, type, size, processInfo } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'UPLOADED',
      name,
    });

    trackWebdavEvent('Upload', {
      name,
      type,
      size,
      elapsedTime: processInfo?.elapsedTime,
    });
  });
}

function subscribeToFlowErrors(ipc: IpcWebdavFlowErrors) {
  ipc.on('WEBDAV_FILE_UPLOAD_ERROR', (_, payload) => {
    const { name, error } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'UPLOAD_ERROR',
      name,
    });

    trackWebdavError('Upload Error', new Error(error), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Upload',
    });
  });

  ipc.on('WEBDAV_FILE_DOWNLOAD_ERROR', (_, payload) => {
    const { name, error } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOAD_ERROR',
      name,
    });

    trackWebdavError('Download Error', new Error(error), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Download',
    });
  });

  ipc.on('WEBDAV_FILE_RENAME_ERROR', (_, payload) => {
    const { name, error } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'RENAME_ERROR',
      name,
    });

    trackWebdavError('Rename Error', new Error(error), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Rename',
    });
  });

  ipc.on('WEBDAV_FILE_DELETE_ERROR', (_, payload) => {
    const { name, error } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'DELETE_ERROR',
      name,
    });

    trackWebdavError('Delete Error', new Error(error), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Delete',
    });
  });

  ipc.on('WEBDAV_ACTION_ERROR', (_, error: Error, ctx: WebdavErrorContext) => {
    const errorName = `${ctx.action} Error` as const;
    trackWebdavError(errorName, error, ctx);
  });
}

let lastVirtualDriveStatus: VirtualDriveStatus = VirtualDriveStatus.MOUNTING;
ipcMain.handle('get-virtual-drive-status', () => lastVirtualDriveStatus);
function subscribeToServerEvents() {
  ipcWebdav.on('WEBDAV_VIRTUAL_DRIVE_STARTING', () => {
    lastVirtualDriveStatus = VirtualDriveStatus.MOUNTING;
    Logger.info('WEBDAV_VIRTUAL_DRIVE_STARTING');
    broadcastToWindows('virtual-drive-status-change', {
      status: VirtualDriveStatus.MOUNTING,
    });
  });
  ipcWebdav.on('WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY', () => {
    lastVirtualDriveStatus = VirtualDriveStatus.MOUNTED;
    Logger.info('WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY');
    broadcastToWindows('virtual-drive-status-change', {
      status: VirtualDriveStatus.MOUNTED,
    });
  });

  ipcWebdav.on('WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR', (_, err: Error) => {
    Logger.info('WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR', err.message);
    lastVirtualDriveStatus = VirtualDriveStatus.FAILED_TO_MOUNT;
    broadcastToWindows('virtual-drive-status-change', {
      status: VirtualDriveStatus.FAILED_TO_MOUNT,
    });
  });

  ipcWebdav.on('WEBDAV_VIRTUAL_DRIVE_UNMOUNT_ERROR', (_, err: Error) => {
    Logger.info('WEBDAV_VIRTUAL_DRIVE_UNMOUNT_ERROR', err.message);
  });
}

subscribeToFlowEvents(ipcWebdav);
subscribeToFlowErrors(ipcWebdav);
subscribeToServerEvents();
