import Logger from 'electron-log';
import { ipcWebdav, IpcWebdavFlow, IpcWebdavFlowErrors } from '../ipcs/webdav';
import { getTrackBandwith, trackWebdavError, trackWebdavEvent } from './service';
import { WebdavErrorContext } from '../../shared/IPC/events/webdav';
import { broadcastToWindows } from '../windows';
import { VirtualDriveStatus } from '../../workers/webdav/VirtualDrive';
import { ipcMain } from 'electron';

function subscribeToFlowEvents(ipc: IpcWebdavFlow) {
  ipc.on('WEBDAV_FILE_DELETED', (_, payload) => {
    const { name, extension, nameWithExtension, size } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'DELETED',
      name: nameWithExtension,
    });

    trackWebdavEvent('Delete Completed', {
      file_name: name,
      file_extension: extension,
      file_size: size,
    });
  });

  ipc.on('WEBDAV_FILE_DOWNLOADING', (_, payload) => {
    const { name, nameWithExtension, size, extension, processInfo } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOADING',
      name: nameWithExtension,
      progress: processInfo.progress,
    });

    if (!processInfo.progress) {
      trackWebdavEvent('Download Started', {
        file_name: name,
        file_extension: extension,
        file_size: size,
        elapsedTimeMs: processInfo.elapsedTime,
        bandwith: getTrackBandwith(size / 8, processInfo.elapsedTime / 1000),
      });
    }
  });

  ipc.on('WEBDAV_FILE_DOWNLOADED', (_, payload) => {
    const { name, extension, nameWithExtension, size, processInfo } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOADED',
      name: nameWithExtension,
    });

    trackWebdavEvent('Download Completed', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      elapsedTimeMs: processInfo.elapsedTime,
      bandwith: getTrackBandwith(size / 8, processInfo.elapsedTime / 1000),
    });
  });

  ipc.on('WEBDAV_FILE_MOVED', (_, payload) => {
    const { nameWithExtension } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'MOVED',
      name: nameWithExtension,
    });
  });

  ipc.on('WEBDAV_FILE_OVERWRITED', (_, payload) => {
    const { nameWithExtension } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'MOVED',
      name: nameWithExtension,
    });
  });

  ipc.on('WEBDAV_FILE_RENAMED', (_, payload) => {
    const { nameWithExtension } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'RENAMED',
      name: nameWithExtension,
    });
  });

  ipc.on('WEBDAV_FILE_CLONNED', (_, payload) => {
    const { name, extension, nameWithExtension, size, processInfo } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'UPLOADED',
      name: nameWithExtension,
    });

    trackWebdavEvent('Upload Completed', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      cloned: true,
      elapsedTimeMs: processInfo.elapsedTime,
      bandwith: getTrackBandwith(size / 8, processInfo.elapsedTime / 1000),
    });
  });

  ipc.on('WEBDAV_FILE_UPLOADING', (_, payload) => {
    const { name, nameWithExtension, size, extension, processInfo } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'UPLOADING',
      name: nameWithExtension,
      progress: processInfo.progress,
    });

    if (!processInfo.progress) {
      trackWebdavEvent('Upload Started', {
        file_name: name,
        file_extension: extension,
        file_size: size,
        elapsedTimeMs: processInfo.elapsedTime,
        bandwith: getTrackBandwith(size / 8, processInfo.elapsedTime / 1000),
      });
    }
  });

  ipc.on('WEBDAV_FILE_UPLOADED', (_, payload) => {
    const { name, extension, nameWithExtension, size, processInfo } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'UPLOADED',
      name: nameWithExtension,
    });

    trackWebdavEvent('Upload Completed', {
      file_name: name,
      file_extension: extension,
      file_size: size,
      elapsedTimeMs: processInfo.elapsedTime,
      bandwith: getTrackBandwith(size / 8, processInfo.elapsedTime / 1000),
    });
  });
}

function subscribeToFlowErrors(ipc: IpcWebdavFlowErrors) {
  ipc.on('WEBDAV_FILE_UPLOAD_ERROR', (_, payload) => {
    const { name, nameWithExtension, error } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'UPLOAD_ERROR',
      name: nameWithExtension,
    });

    trackWebdavError('Upload Error', new Error(error), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Upload',
    });
  });

  ipc.on('WEBDAV_FILE_DOWNLOAD_ERROR', (_, payload) => {
    const { name, nameWithExtension, error } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'DOWNLOAD_ERROR',
      name: nameWithExtension,
    });

    trackWebdavError('Download Error', new Error(error), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Download',
    });
  });

  ipc.on('WEBDAV_FILE_RENAME_ERROR', (_, payload) => {
    const { name, nameWithExtension, error } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'RENAME_ERROR',
      name: nameWithExtension,
    });

    trackWebdavError('Rename Error', new Error(error), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Rename',
    });
  });

  ipc.on('WEBDAV_FILE_DELETE_ERROR', (_, payload) => {
    const { name, nameWithExtension, error } = payload;

    broadcastToWindows('sync-info-update', {
      action: 'DELETE_ERROR',
      name: nameWithExtension,
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
