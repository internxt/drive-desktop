import Logger from 'electron-log';
import { ipcWebdav, IpcWebdavFlow, IpcWebdavFlowErrors } from '../ipcs/webdav';
import {
  trackHandledWebdavError,
  trackWebdavError,
  trackWebdavEvent,
} from './service';
import { WebdavErrorContext } from '../../shared/IPC/events/webdav';

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
    trackWebdavError('Upload Error', { name, error });
  });

  ipc.on('WEBDAV_ACTION_ERROR', (_, error: Error, ctx: WebdavErrorContext) => {
    const errorName = `${ctx.action} Error` as const;
    trackHandledWebdavError(errorName, error, ctx);
  });
}

function subscribeToServerEvents() {
  ipcWebdav.on('WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY', () => {
    Logger.info('WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY');
  });

  ipcWebdav.on('WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR', (_, err: Error) => {
    Logger.info('WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR', err.message);
  });
}

subscribeToFlowEvents(ipcWebdav);
subscribeToFlowErrors(ipcWebdav);
subscribeToServerEvents();
