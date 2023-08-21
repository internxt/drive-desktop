import { BrowserWindow, ipcMain, app } from 'electron';
import { ipcWebdav } from '../ipcs/webdav';
import path, { resolve } from 'path';
import Logger from 'electron-log';
import eventBus from '../event-bus';
import {
  ejectMacOSInstallerDisks,
  unmountDrive,
} from '../../workers/webdav/VirtualDrive';
import { reject } from 'lodash';

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

export async function stopVirtualDrive() {
  const stp = new Promise<void>((resolve, reject) => {
    ipcWebdav.once('WEBDAV_SERVER_STOP_ERROR', (_, err: Error) => {
      Logger.error('ERROR STOPING WEBDAV SERVER', err);
      reject();
    });

    ipcWebdav.once('WEBDAV_SERVER_STOP_SUCCESS', () => {
      resolve();
    });
  });

  webdavWorker?.webContents.send('STOP_VIRTUAL_DRIVE_PROCESS');

  await stp;
}

function startWebDavServer() {
  webdavWorker?.webContents.send('START_VIRTUAL_DRIVE_PROCESS');
}

eventBus.on('USER_LOGGED_OUT', stopVirtualDrive);
eventBus.on('USER_WAS_UNAUTHORIZED', stopVirtualDrive);
eventBus.on('USER_LOGGED_IN', () => {
  if (webdavWorker === null) {
    spawnWebdavServerWorker();
  } else {
    startWebDavServer();
  }
});

ipcMain.handle('retry-virtual-drive-mount', () => {
  webdavWorker?.webContents.send('RETRY_VIRTUAL_DRIVE_MOUNT');
});
