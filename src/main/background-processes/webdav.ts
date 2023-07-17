import { BrowserWindow, ipcMain } from 'electron';
import { ipcWebdav } from '../ipcs/webdav';
import path from 'path';
import Logger from 'electron-log';
import eventBus from '../event-bus';
import { ejectMacOSInstallerDisks } from '../../workers/webdav/VirtualDrive';


let webdavWorker: BrowserWindow | null = null;

function spawnWebdavServerWorker() {
  Logger.log('Spawning webdav server!');

  webdavWorker = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
    show: false,
  });
  webdavWorker
    .loadFile(
      process.env.NODE_ENV === 'development'
        ? '../../release/app/dist/webdav/index.html'
        : `${path.join(__dirname, '..', 'webdav')}/index.html`
    )
    .catch((err) => {
      Logger.error('Error loading worker', err);
    });

  return webdavWorker;
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
  webdavWorker?.webContents.send('STOP_WEBDAV_SERVER_PROCESS');
}

function startWebDavServer() {
  webdavWorker?.webContents.send('START_WEBDAV_SERVER_PROCESS');
}

eventBus.on('USER_LOGGED_OUT', stopWebDavServer);
eventBus.on('USER_WAS_UNAUTHORIZED', stopWebDavServer);
eventBus.on('USER_LOGGED_IN', () => {
  if (webdavWorker === null) {
    spawnWebdavServerWorker();
  } else {
    startWebDavServer();
  }
});

eventBus.on('APP_IS_READY', ejectMacOSInstallerDisks);

ipcMain.handle('retry-virtual-drive-mount', () => {
  webdavWorker?.webContents.send('RETRY_VIRTUAL_DRIVE_MOUNT');
});
