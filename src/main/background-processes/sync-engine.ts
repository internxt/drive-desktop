import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Logger from 'electron-log';
import eventBus from '../event-bus';

let worker: BrowserWindow | null = null;

function spawnSyncEngineWorker() {
  Logger.info('[MAIN] LOADING SYNC ENGINE WORKER...');

  worker = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
    show: false,
  });
  worker
    .loadFile(
      process.env.NODE_ENV === 'development'
        ? '../../release/app/dist/webdav/index.html'
        : `${path.join(__dirname, '..', 'webdav')}/index.html`
    )
    .then(() => {
      Logger.info('[MAIN] SYNC ENGINE WORKER LOADED');
    })
    .catch((err) => {
      Logger.error('[MAIN] ERROR LOADING SYNC ENGINE WORKER', err);
    });

  worker.on('close', () => {
    Logger.debug('[MAIN] SYNC ENGINE WORKER CLOSED');
    worker?.destroy();
  });
}

export async function stopSyncEngineWatcher() {
  Logger.info('[MAIN] STOPING SYNC ENGINE WORKER...');

  const stopPromise = new Promise<void>((resolve, reject) => {
    ipcMain.once('SYNC_ENGINE_STOP_ERROR', (_, err: Error) => {
      Logger.error('[MAIN] ERROR STOPING SYNC ENGINE WORKER', err);
      reject();
    });

    ipcMain.once('SYNC_ENGINE_STOP_SUCCESS', () => {
      resolve();
      Logger.info('[MAIN] SYNC ENGINE STOPPED');
    });
  });

  try {
    worker?.webContents.send('STOP_SYNC_ENGINE_PROCESS');

    await stopPromise;
  } catch (err) {
    // TODO: handle error
    Logger.error(err);
    worker?.destroy();
    // no op
  }
}

eventBus.on('USER_LOGGED_OUT', stopSyncEngineWatcher);
eventBus.on('USER_WAS_UNAUTHORIZED', stopSyncEngineWatcher);
eventBus.on('USER_LOGGED_IN', spawnSyncEngineWorker);
