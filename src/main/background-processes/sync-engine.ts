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
    Logger.debug('[MAIN] SYNC ENGINE RUNNING');
    workerIsRunning = true;
  });

  ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_FAILED', () => {
    Logger.debug('[MAIN] SYNC ENGINE NOT RUNNING');
    workerIsRunning = false;
  });
}

export async function stopSyncEngineWatcher() {
  Logger.info('[MAIN] STOPPING SYNC ENGINE WORKER...');

  if (!workerIsRunning) {
    Logger.info('[MAIN] WORKER WAS NOT RUNNING');
    worker?.destroy();
    worker = null;
    return;
  }

  const stopPromise = new Promise<void>((resolve, reject) => {
    ipcMain.once('SYNC_ENGINE_STOP_ERROR', (_, error: Error) => {
      Logger.error('[MAIN] Error stopping sync engine worker', error);
      reject(error);
    });

    ipcMain.once('SYNC_ENGINE_STOP_SUCCESS', () => {
      resolve();
      Logger.info('[MAIN] Sync engine stopped');
    });

    const millisecondsToWait = 10_000;

    setTimeout(() => {
      reject(
        new Error(
          `Timeout waiting for sync engine to stop after ${millisecondsToWait} milliseconds`
        )
      );
    }, millisecondsToWait);
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

async function stopAndClearSyncEngineWatcher() {
  Logger.info('[MAIN] STOPPING AND CLEAR SYNC ENGINE WORKER...');

  if (!workerIsRunning) {
    Logger.info('[MAIN] WORKER WAS NOT RUNNING');
    worker?.destroy();
    worker = null;
    return;
  }

  const response = new Promise<void>((resolve, reject) => {
    ipcMain.once(
      'ERROR_ON_STOP_AND_CLEAR_SYNC_ENGINE_PROCESS',
      (_, error: Error) => {
        Logger.error('[MAIN] Error stopping sync engine worker', error);
        reject(error);
      }
    );

    ipcMain.once('SYNC_ENGINE_STOP_AND_CLEAR_SUCCESS', () => {
      resolve();
      Logger.info('[MAIN] Sync engine stopped and cleared');
    });

    const millisecondsToWait = 10_000;

    setTimeout(() => {
      reject(
        new Error(
          `Timeout waiting for sync engine to stop after ${millisecondsToWait} milliseconds`
        )
      );
    }, millisecondsToWait);
  });

  try {
    worker?.webContents.send('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS');

    await response;
  } catch (err) {
    // TODO: handle error
    Logger.error(err);
  } finally {
    worker?.destroy();
    workerIsRunning = false;
    worker = null;
  }
}

export function updateSyncEngine() {
  try {
    worker?.webContents.send('UPDATE_SYNC_ENGINE_PROCESS');
  } catch (err) {
    // TODO: handle error
    Logger.error(err);
  }
}

eventBus.on('USER_LOGGED_OUT', stopAndClearSyncEngineWatcher);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearSyncEngineWatcher);
eventBus.on('INITIAL_SYNC_READY', spawnSyncEngineWorker);
