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

    trackWebdavEvent('Delete', {
      name,
      type,
      size,
    });
  });

  ipc.on('WEBDAV_FILE_DOWNLOADED', (_, payload) => {
    const { name, type, size, uploadInfo } = payload;

    trackWebdavEvent('Upload', {
      name,
      type,
      size,
      elapsedTime: uploadInfo.elapsedTime,
    });
  });

  ipc.on('WEBDAV_FILE_MOVED', (_, payload) => {
    const { name, folderName } = payload;

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

    trackWebdavEvent('Rename', {
      name,
    });
  });

  ipc.on('WEBDAV_FILE_CLONNED', (_, payload) => {
    const { name, type, size, uploadInfo } = payload;

    trackWebdavEvent('Upload', {
      name,
      type,
      size,
      clonned: true,
      elapsedTime: uploadInfo.elapsedTime,
    });
  });

  ipc.on('WEBDAV_FILE_UPLOADED', (_, payload) => {
    const { name, type, size, uploadInfo } = payload;

    trackWebdavEvent('Upload', {
      name,
      type,
      size,
      elapsedTime: uploadInfo.elapsedTime,
    });
  });
}

function subscribeToFlowErrors(ipc: IpcWebdavFlowErrors) {
  ipc.on('WEBDAV_FILE_UPLOADED_ERROR', (_, payload) => {
    const { name, error } = payload;

    trackWebdavError('Upload Error', new Error(error), {
      itemType: 'File',
      root: '',
      from: name,
      action: 'Upload',
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
