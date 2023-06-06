import { ipcMain, IpcMainEvent } from 'electron';
import Logger from 'electron-log';
import { WebdavDomainEvent } from '../../workers/webdav/modules/shared/domain/WebdavDomainEvent';
import { ipcWebdav } from '../ipcs/webdav';

function subscribeToDomainEvents() {
  function subscribeTo(
    eventName: string,
    listener: (event: IpcMainEvent, domainEvent: WebdavDomainEvent) => void
  ) {
    ipcMain.on(`webdav.${eventName}`, listener);
  }

  subscribeTo('file.created', (event, args) => {
    Logger.info('event listened', 'file.created');
  });

  subscribeTo('file.downloaded', (event, args) => {
    Logger.info('event listened', 'file.downloaded');
  });

  subscribeTo('file.deleted', (event, args) => {
    Logger.info('event listened', 'file.deleted');
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

subscribeToDomainEvents();
subscribeToServerEvents();
