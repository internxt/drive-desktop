import { ipcMain, IpcMainEvent } from 'electron';
import Logger from 'electron-log';

function subscribeTo(
  eventName: string,
  listener: (event: IpcMainEvent, ...args: any[]) => void
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
