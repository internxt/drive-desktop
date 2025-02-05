import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Logger from 'electron-log';
import eventBus from '../event-bus';
import nodeSchedule from 'node-schedule';
import * as Sentry from '@sentry/electron/main';
import { monitorHealth } from './sync-engine/monitor-health';

let worker: BrowserWindow | null = null;
let workerIsRunning = false;
let startingWorker = false;
let healthCheckSchedule: nodeSchedule.Job | null = null;
let syncSchedule: nodeSchedule.Job | null = null;
let attemptsAlreadyStarting = 0;

ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL', () => {
  Logger.debug('[MAIN] SYNC ENGINE RUNNING');
  workerIsRunning = true;
  startingWorker = false;
});

ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_FAILED', () => {
  Logger.debug('[MAIN] SYNC ENGINE FAILED');
  workerIsRunning = false;
  startingWorker = false;
});

function scheduleSync() {
  if (syncSchedule) {
    syncSchedule.cancel(false);
  }

  syncSchedule = nodeSchedule.scheduleJob('0 0 */2 * * *', async () => {
    eventBus.emit('RECEIVED_REMOTE_CHANGES');
  });
}

export function spawnSyncEngineWorker() {
  if (startingWorker) {
    Logger.info('[MAIN] Worker is already starting');
    attemptsAlreadyStarting++;
    return;
  }
  if (workerIsRunning) {
    Logger.info('[MAIN] Worker is already running');
    return;
  }

  Logger.info('[MAIN] SPAWNING SYNC ENGINE WORKER...');
  startingWorker = true;

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
        ? '../../../release/app/dist/sync-engine/index.html'
        : `${path.join(__dirname, '..', 'sync-engine')}/index.html`
    )
    .then(() => {
      Logger.info('[MAIN] Sync engine worker loaded');
      scheduleSync();
    })
    .catch((err) => {
      Logger.error('[MAIN] Error loading sync engine worker', err);
      Sentry.captureException(err);
    });
  
  worker.webContents.on('console-message', (event, level, message) => {
    console.log(`[WORKER CONSOLE ${level}] ${message}`);
  });

  monitorHealth({ worker, stopAndSpawn: async () => {
    await stopAndClearSyncEngineWatcher();
    spawnSyncEngineWorker();
  }});
}

export async function stopAndClearSyncEngineWatcher() {
  Logger.info('[MAIN] STOPPING AND CLEAR SYNC ENGINE WORKER...');

  healthCheckSchedule?.cancel(false);

  if (!workerIsRunning) {
    Logger.info('[MAIN] WORKER WAS NOT RUNNING');
    worker?.destroy();
    worker = null;

    return;
  }

  const response = new Promise<void>((resolve, reject) => {
    ipcMain.on(
      'ERROR_ON_STOP_AND_CLEAR_SYNC_ENGINE_PROCESS',
      (_, error: Error) => {
        Logger.error('[MAIN] Error stopping sync engine worker', error);
        Sentry.captureException(error);
        reject(error);
      }
    );

    ipcMain.on('SYNC_ENGINE_STOP_AND_CLEAR_SUCCESS', () => {
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
    worker?.webContents?.send('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS');

    await response;
  } catch (err) {
    // TODO: handle error
    Logger.error(err);
    Sentry.captureException(err);
  } finally {
    worker?.destroy();
    workerIsRunning = false;
    worker = null;
  }
}

export function updateSyncEngine() {
  try {
    if (
      worker &&
      !worker.isDestroyed() &&
      worker.webContents &&
      !worker.webContents.isDestroyed()
    ) {
      worker.webContents?.send('UPDATE_SYNC_ENGINE_PROCESS');
    }
  } catch (err) {
    // TODO: handle error
    Logger.error(err);
    Sentry.captureException(err);
  }
}

export function fallbackSyncEngine() {
  try {
    if (
      worker &&
      !worker.isDestroyed() &&
      worker.webContents &&
      !worker.webContents.isDestroyed()
    ) {
      worker?.webContents?.send('FALLBACK_SYNC_ENGINE_PROCESS');
    }
  } catch (err) {
    Logger.error(err);
  }
}
export async function sendUpdateFilesInSyncPending(): Promise<string[]> {
  try {
    if (
      worker &&
      !worker.isDestroyed() &&
      worker.webContents &&
      !worker.webContents.isDestroyed()
    ) {
      worker?.webContents?.send('UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE_PROCESS');
    }
    return [];
  } catch (err) {
    Logger.error(err);
    return [];
  }
}

eventBus.on('USER_LOGGED_OUT', stopAndClearSyncEngineWatcher);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearSyncEngineWatcher);
eventBus.on('INITIAL_SYNC_READY', spawnSyncEngineWorker);
