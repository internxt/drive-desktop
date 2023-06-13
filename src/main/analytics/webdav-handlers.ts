import { ipcMain, IpcMainEvent } from 'electron';
import Logger from 'electron-log';
import { FileCreatedDomainEvent } from '../../workers/webdav/modules/files/domain/FileCreatedDomainEvent';
import { ipcWebdav } from '../ipcs/webdav';
import { trackWebdavError, trackWebdavEvent } from './service';
import { WebdavDomainEvent } from '../../workers/webdav/modules/shared/domain/WebdavDomainEvent';
import { FileDownloadedDomainEvent } from '../../workers/webdav/modules/files/domain/FileDownloadedDomainEvent';
import { FileDeletedDomainEvent } from '../../workers/webdav/modules/files/domain/FileDeletedDomainEvent';
import { WebdavErrorContext } from '../../shared/IPC/events/webdav';

function subscribeToDomainEvents() {
  function subscribeTo<Event extends WebdavDomainEvent>(
    eventName: Event['eventName'],
    listener: (
      event: IpcMainEvent,
      domainEvent: ReturnType<Event['toPrimitives']>
    ) => void
  ) {
    ipcMain.on(`webdav.${eventName}`, listener);
  }

  subscribeTo<FileCreatedDomainEvent>(
    FileCreatedDomainEvent.EVENT_NAME,
    (_, attributes) => {
      trackWebdavEvent('Upload', attributes);
    }
  );

  // For some reason FileDownloadedDomainEvent.EVENT_NAME does not work (￣(エ)￣)ゞ
  subscribeTo<FileDownloadedDomainEvent>('file.downloaded', (_, attributes) => {
    trackWebdavEvent('Preview', attributes);
  });

  subscribeTo<FileDeletedDomainEvent>(FileDeletedDomainEvent.EVENT_NAME, () => {
    trackWebdavEvent('Delete', {});
  });
}

function subscribeToServerEvents() {
  ipcWebdav.on('WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY', () => {
    Logger.info('WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY');
  });

  ipcWebdav.on('WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR', (_, err: Error) => {
    Logger.info('WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR', err.message);
  });

  ipcWebdav.on(
    'WEBDAV_ACTION_ERROR',
    (_, error: Error, ctx: WebdavErrorContext) => {
      const errorName = `${ctx.action} Error` as const;
      trackWebdavError(errorName, error, ctx);
    }
  );
}

subscribeToDomainEvents();
subscribeToServerEvents();
