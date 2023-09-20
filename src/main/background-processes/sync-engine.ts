import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Logger from 'electron-log';
import eventBus from '../event-bus';

let worker: BrowserWindow | null = null;
let workerIsRunning = false;

function spawnSyncEngineWorker() {
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
        ? '../../release/app/dist/sync-engine/index.html'
        : `${path.join(__dirname, '..', 'sync-engine')}/index.html`
    )
    .then(() => {
      Logger.info('[MAIN] Sync engine worker loaded');
    })
    .catch((err) => {
      Logger.error('[MAIN] Error loading sync engine worker', err);
    });

  worker.on('close', () => {
    worker?.destroy();
  });

  ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL', () => {
    Logger.debug('[MAIN] SYNC ENGINE RUNNIG');
    workerIsRunning = true;
  });

  ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_FAILED', () => {
    Logger.debug('[MAIN] SYNC ENGINE NOT RUNNIG');
    workerIsRunning = false;
  });
}

export async function stopSyncEngineWatcher() {
  Logger.info('[MAIN] STOPING SYNC ENGINE WORKER...');

  if (!workerIsRunning) {
    Logger.info('[MAIN] WORKER WAS NOT RUNNIG');
    worker?.destroy();
    worker = null;
    return;
  }

  const stopPromise = new Promise<void>((resolve, reject) => {
    ipcMain.once('SYNC_ENGINE_STOP_ERROR', (_, error: Error) => {
      Logger.error('[MAIN] Error stoping sync engine worker', error);
      reject(error);
    });

    ipcMain.once('SYNC_ENGINE_STOP_SUCCESS', () => {
      resolve();
      Logger.info('[MAIN] Sync engine stopped');
    });

    const millisecndsToWait = 10_000;

    setTimeout(() => {
      reject(
        new Error(
          `Timeout waiting for sync engien to stop after ${millisecndsToWait} milliseconds`
        )
      );
    }, millisecndsToWait);
  });

  try {
    worker?.webContents.send('STOP_SYNC_ENGINE_PROCESS');

    await stopPromise;
  } catch (err) {
    // TODO: handle error
    Logger.error(err);
  } finally {
    worker?.destroy();
    workerIsRunning = false;
    worker = null;
  }
}

eventBus.on('USER_LOGGED_OUT', stopSyncEngineWatcher);
eventBus.on('USER_WAS_UNAUTHORIZED', stopSyncEngineWatcher);
eventBus.on('INITIAL_SYNC_READY', spawnSyncEngineWorker);
