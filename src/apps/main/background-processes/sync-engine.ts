import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import eventBus from '../event-bus';
import nodeSchedule from 'node-schedule';
import isDev from '../../../core/isDev/isDev';

let worker: BrowserWindow | null = null;
let workerIsRunning = false;
let startingWorker = false;
let healthCheckSchedule: nodeSchedule.Job | null = null;

async function healthCheck() {
  const responsePromise = new Promise<void>((resolve, reject) => {
    ipcMain.once('SYNC_ENGINE:PONG', () => {
      resolve();
    });

    const millisecondsToWait = 2_000;

    setTimeout(() => {
      reject(
        new Error(
          `Health check failed after ${millisecondsToWait} milliseconds`
        )
      );
    }, millisecondsToWait);
  });

  worker?.webContents.send('SYNC_ENGINE:PING');

  await responsePromise;
}

function scheduleHeathCheck() {
  if (healthCheckSchedule) {
    healthCheckSchedule.cancel(false);
  }

  const relaunchOnFail = () =>
    healthCheck()
      .then(() => {
        // Logger.debug('Health check succeeded');
      })
      .catch(() => {
        logger.warn({ msg: 'Health check failed, relaunching the worker' });
        workerIsRunning = false;
        worker?.destroy();
        spawnSyncEngineWorker();
      });

  healthCheckSchedule = nodeSchedule.scheduleJob('*/30 * * * * *', async () => {
    await relaunchOnFail();
  });
}

function spawnSyncEngineWorker() {
  if (startingWorker) {
    logger.debug({ msg: '[MAIN] Worker is already starting' });
    return;
  }
  if (workerIsRunning) {
    logger.debug({ msg: '[MAIN] Worker is already running' });
    return;
  }

  startingWorker = true;

  worker = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      devTools: isDev(),
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
      logger.debug({ msg: '[MAIN] Sync engine worker loaded' });
      scheduleHeathCheck();
    })
    .catch((err) => {
      logger.error({ msg: '[MAIN] Error loading sync engine worker', err });
    });

  worker.on('close', () => {
    worker?.destroy();

    if (workerIsRunning) {
      logger.warn({
        msg: 'The sync engine process ended unexpectedly, relaunching',
      });
      workerIsRunning = false;
      spawnSyncEngineWorker();
    }
  });

  ipcMain.once('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL', () => {
    logger.debug({ tag: 'SYNC-ENGINE', msg: '[MAIN] SYNC ENGINE RUNNING' });
    workerIsRunning = true;
    startingWorker = false;
  });

  ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_FAILED', () => {
    logger.debug({ tag: 'SYNC-ENGINE', msg: '[MAIN] SYNC ENGINE NOT RUNNING' });
    workerIsRunning = false;
    startingWorker = false;
  });
}

export async function stopSyncEngineWatcher() {
  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: '[MAIN] STOPPING SYNC ENGINE WORKER...',
  });

  healthCheckSchedule?.cancel(false);

  if (!workerIsRunning) {
    logger.debug({ tag: 'SYNC-ENGINE', msg: '[MAIN] WORKER WAS NOT RUNNING' });
    worker?.destroy();
    worker = null;
    return;
  }

  const stopPromise = new Promise<void>((resolve, reject) => {
    ipcMain.once('SYNC_ENGINE_STOP_ERROR', (_, error: Error) => {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: '[MAIN] Error stopping sync engine worker',
        error,
      });
      reject(error);
    });

    ipcMain.once('SYNC_ENGINE_STOP_SUCCESS', () => {
      resolve();
      logger.debug({ tag: 'SYNC-ENGINE', msg: '[MAIN] Sync engine stopped' });
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
  } catch (error) {
    // TODO: handle error
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error while stopping sync engine watcher',
      error,
    });
  } finally {
    worker?.destroy();
    workerIsRunning = false;
    worker = null;
  }
}

async function stopAndClearSyncEngineWatcher() {
  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: '[MAIN] STOPPING AND CLEAR SYNC ENGINE WORKER...',
  });

  healthCheckSchedule?.cancel(false);

  if (!workerIsRunning) {
    logger.debug({ tag: 'SYNC-ENGINE', msg: '[MAIN] WORKER WAS NOT RUNNING' });
    worker?.destroy();
    worker = null;
    return;
  }

  const response = new Promise<void>((resolve, reject) => {
    ipcMain.once(
      'ERROR_ON_STOP_AND_CLEAR_SYNC_ENGINE_PROCESS',
      (_, error: Error) => {
        logger.error({
          tag: 'SYNC-ENGINE',
          msg: '[MAIN] Error stopping sync engine worker',
          error,
        });
        reject(error);
      }
    );

    ipcMain.once('SYNC_ENGINE_STOP_AND_CLEAR_SUCCESS', () => {
      resolve();
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: '[MAIN] Sync engine stopped and cleared',
      });
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
  } catch (error) {
    // TODO: handle error
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error while stopping and clearing sync engine watcher',
      error,
    });
  } finally {
    worker?.destroy();
    workerIsRunning = false;
    worker = null;
  }
}

export function updateSyncEngine() {
  try {
    worker?.webContents.send('UPDATE_SYNC_ENGINE_PROCESS');
  } catch (error) {
    // TODO: handle error
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error while updating sync engine: ',
      error,
    });
  }
}

if (process.platform === 'win32') {
  eventBus.on('USER_LOGGED_OUT', stopAndClearSyncEngineWatcher);
  eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearSyncEngineWatcher);
  eventBus.on('INITIAL_SYNC_READY', spawnSyncEngineWorker);
}
