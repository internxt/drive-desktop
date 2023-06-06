import { BrowserWindow } from 'electron';
import { ipcWebdav } from '../ipcs/webdav';
import path from 'path';
import Logger from 'electron-log';
import eventBus from '../event-bus';

function spawnWebdavServerWorker() {
  Logger.log('Spawning webdav server!');
  const worker = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  worker
    .loadFile(
      process.env.NODE_ENV === 'development'
        ? '../../release/app/dist/webdav/index.html'
        : `${path.join(__dirname, '..', 'webdav')}/index.html`
    )
    .catch((err) => {
      Logger.error('Error loading worker', err);
    });

  return worker;
}

ipcWebdav.once('WEBDAV_SERVER_START_ERROR', (_, err: Error) => {
  Logger.error('ERROR STARTING WEBDAV SERVER', err);
});

ipcWebdav.once('WEBDAV_SERVER_ADDING_ROOT_FOLDER_ERROR', (_, err: Error) => {
  Logger.error('ERROR ADDING ROOT FOLDER TO WEBDAV SERVER', err);
});

function stopWebDavServer() {
  ipcWebdav.once('WEBDAV_SERVER_STOP_ERROR', (_, err: Error) => {
    Logger.error('ERROR STOPING WEBDAV SERVER', err);
  });
  ipcWebdav.emit('STOP_WEBDAV_SERVER_PROCESS');
}

eventBus.on('USER_LOGGED_OUT', stopWebDavServer);
eventBus.on('USER_WAS_UNAUTHORIZED', stopWebDavServer);

eventBus.on('USER_LOGGED_IN', () => {
  spawnWebdavServerWorker();
});
