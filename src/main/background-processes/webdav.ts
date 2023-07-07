import { BrowserWindow, ipcMain } from 'electron';
import { ipcWebdav } from '../ipcs/webdav';
import path from 'path';
import Logger from 'electron-log';
import eventBus from '../event-bus';

enum SpawnWebdavServerMode {
  OnAppStart = 'APP_START',
  OnInitialSyncReady = 'INITIAL_SYNC_READY',
}
const SPAWN_WEBDAV_SERVER_ON: SpawnWebdavServerMode =
  SpawnWebdavServerMode.OnInitialSyncReady as SpawnWebdavServerMode;

let webdavWorker: BrowserWindow | null = null;
export const getWebdavWorkerWindow = () =>
  webdavWorker?.isDestroyed() ? null : webdavWorker;
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

eventBus.on('USER_LOGGED_OUT', stopWebDavServer);
eventBus.on('USER_WAS_UNAUTHORIZED', stopWebDavServer);

if (SPAWN_WEBDAV_SERVER_ON === SpawnWebdavServerMode.OnInitialSyncReady) {
  eventBus.on('INITIAL_SYNC_READY', () => {
    spawnWebdavServerWorker();
  });
}

if (SPAWN_WEBDAV_SERVER_ON === SpawnWebdavServerMode.OnAppStart) {
  eventBus.on('USER_LOGGED_IN', () => {
    spawnWebdavServerWorker();
  });
}

ipcMain.handle('retry-virtual-drive-mount', () => {
  webdavWorker?.webContents.send('RETRY_VIRTUAL_DRIVE_MOUNT');
});
