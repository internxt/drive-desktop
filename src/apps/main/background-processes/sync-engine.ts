import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Logger from 'electron-log';
import eventBus from '../event-bus';
import nodeSchedule from 'node-schedule';
import * as Sentry from '@sentry/electron/main';
import { monitorHealth } from './sync-engine/monitor-health';
import { Config } from '../../sync-engine/config';
import { getLoggersPaths, getRootVirtualDrive, getRootWorkspace } from '../virtual-root-folder/service';
import { logger } from '../../../apps/shared/logger/logger';
import { syncWorkspaceService } from '../remote-sync/handlers';
import { getUser } from '../auth/service';

interface WorkerConfig {
  worker: BrowserWindow | null;
  workerIsRunning: boolean;
  startingWorker: boolean;
  syncSchedule: nodeSchedule.Job | null;
}

const workers: { [key: string]: WorkerConfig } = {};

ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL', (event, workspaceId = '') => {
  Logger.debug(`[MAIN] SYNC ENGINE RUNNING for workspace ${workspaceId}`);
  if (workers[workspaceId]) {
    workers[workspaceId].workerIsRunning = true;
    workers[workspaceId].startingWorker = false;
  }
});

ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_FAILED', (event, workspaceId) => {
  Logger.debug(`[MAIN] SYNC ENGINE FAILED for workspace ${workspaceId}`);
  if (workers[workspaceId]) {
    workers[workspaceId].workerIsRunning = false;
    workers[workspaceId].startingWorker = false;
  }
});

function scheduleSync(workspaceId: string) {
  if (workers[workspaceId].syncSchedule) {
    workers[workspaceId].syncSchedule.cancel(false);
  }

  workers[workspaceId].syncSchedule = nodeSchedule.scheduleJob('0 0 */2 * * *', async () => {
    eventBus.emit('RECEIVED_REMOTE_CHANGES', workspaceId);
  });
}

export async function spawnSyncEngineWorker(config: Config) {
  const { workspaceId, providerName } = config;

  if (!workers[workspaceId]) {
    workers[workspaceId] = {
      worker: null,
      workerIsRunning: false,
      startingWorker: false,
      syncSchedule: null,
    };
  }

  if (workers[workspaceId].startingWorker) {
    Logger.info(`[MAIN] Worker for drive ${providerName}: ${workspaceId} is already starting`);
    return;
  }

  if (workers[workspaceId].workerIsRunning) {
    Logger.info(`[MAIN] Worker for drive ${providerName}: ${workspaceId} is already running`);
    return;
  }

  Logger.info(`[MAIN] SPAWNING SYNC ENGINE WORKER for workspace  ${providerName}: ${workspaceId}...`);
  workers[workspaceId].startingWorker = true;

  const worker = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
    show: false,
  });

  try {
    await worker.loadFile(
      process.env.NODE_ENV === 'development'
        ? '../../../release/app/dist/sync-engine/index.html'
        : `${path.join(__dirname, '..', 'sync-engine')}/index.html`,
    );

    logger.info(`[MAIN] SYNC ENGINE WORKER for workspace ${providerName}: ${workspaceId} LOADED`);

    worker.webContents.send('SET_CONFIG', config);

    monitorHealth({
      worker,
      stopAndSpawn: async () => {
        await stopAndClearSyncEngineWatcher(workspaceId);
        await spawnSyncEngineWorker(config);
      },
    });

    scheduleSync(workspaceId);

    workers[workspaceId].worker = worker;
  } catch (err) {
    Logger.error(`[MAIN] Error loading sync engine worker for workspace ${providerName}: ${workspaceId}`, err);
    Sentry.captureException(err);
  }
}

async function stopAndClearSyncEngineWatcher(workspaceId = '') {
  Logger.info(`[MAIN] STOPPING AND CLEARING SYNC ENGINE WORKER for workspace ${workspaceId}...`);

  if (!workers[workspaceId] || !workers[workspaceId].workerIsRunning) {
    Logger.info(`[MAIN] WORKER for workspace ${workspaceId} WAS NOT RUNNING`);
    workers[workspaceId]?.worker?.destroy();
    delete workers[workspaceId];

    return;
  }

  const response = new Promise<void>((resolve, reject) => {
    ipcMain.on('ERROR_ON_STOP_AND_CLEAR_SYNC_ENGINE_PROCESS', (_, error: Error) => {
      Logger.error(`[MAIN] Error stopping sync engine worker for workspace ${workspaceId}`, error);
      Sentry.captureException(error);
      reject(error);
    });

    ipcMain.on('SYNC_ENGINE_STOP_AND_CLEAR_SUCCESS', () => {
      resolve();
      Logger.info(`[MAIN] Sync engine stopped and cleared for workspace ${workspaceId}`);
    });

    const millisecondsToWait = 10_000;

    setTimeout(() => {
      reject(new Error(`Timeout waiting for sync engine to stop after ${millisecondsToWait} milliseconds`));
    }, millisecondsToWait);
  });

  try {
    workers[workspaceId]?.worker?.webContents?.send('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS');

    await response;
  } catch (err) {
    Logger.error(err);
    Sentry.captureException(err);
  } finally {
    workers[workspaceId]?.worker?.destroy();
    workers[workspaceId].workerIsRunning = false;
    workers[workspaceId].worker = null;
  }
}

export function updateSyncEngine(workspaceId: string) {
  try {
    const worker = workers[workspaceId]?.worker;
    if (worker && !worker.isDestroyed() && worker.webContents && !worker.webContents.isDestroyed()) {
      worker.webContents?.send('UPDATE_SYNC_ENGINE_PROCESS');
    }
  } catch (err) {
    Logger.error(err);
    Sentry.captureException(err);
  }
}

export function fallbackSyncEngine(workspaceId: string) {
  try {
    const worker = workers[workspaceId]?.worker;
    if (worker && !worker.isDestroyed() && worker.webContents && !worker.webContents.isDestroyed()) {
      worker?.webContents?.send('FALLBACK_SYNC_ENGINE_PROCESS');
    }
  } catch (err) {
    Logger.error(err);
  }
}

export async function sendUpdateFilesInSyncPending(workspaceId: string): Promise<string[]> {
  try {
    const worker = workers[workspaceId]?.worker;
    if (worker && !worker.isDestroyed() && worker.webContents && !worker.webContents.isDestroyed()) {
      worker?.webContents?.send('UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE_PROCESS');
    }
    return [];
  } catch (err) {
    Logger.error(err);
    return [];
  }
}

export const stopAndClearAllSyncEngineWatcher = async () => {
  await Promise.all(
    Object.keys(workers).map(async (workspaceId) => {
      await stopAndClearSyncEngineWatcher(workspaceId);
    }),
  );
};

const spawnAllSyncEngineWorker = async () => {
  const user = getUser();

  if (!user) {
    return;
  }
  const providerId = process.env.PROVIDER_ID || 'E9D7EB38-B229-5DC5-9396-017C449D59CD';
  const values: Config = {
    providerId: `{${providerId}}`,
    rootPath: getRootVirtualDrive(),
    providerName: 'Internxt',
    loggerPath: getLoggersPaths().logEnginePath,
    workspaceId: '',
    rootUid: user.rootFolderId,
  };

  logger.info('Spawning sync engine worker for Internxt Drive');
  logger.info({
    values,
  });
  await spawnSyncEngineWorker(values);

  // const workspaces = await syncWorkspaceService.getWorkspaces();

  // await Promise.all(
  //   workspaces.map(async (workspace) => {
  //     const values: Config = {
  //       providerId: `{${workspace.id}}`,
  //       rootPath: getRootWorkspace(workspace.id),
  //       providerName: workspace.name,
  //       loggerPath: getLoggersPaths().logWatcherPath,
  //       workspaceId: workspace.id,
  //       rootUid: await syncWorkspaceService.getRootFolderUuid(workspace.id),
  //     };

  //     await spawnSyncEngineWorker(values);
  //   }),
  // );
};

eventBus.on('USER_LOGGED_OUT', stopAndClearAllSyncEngineWatcher);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearAllSyncEngineWatcher);
eventBus.on('INITIAL_SYNC_READY', spawnAllSyncEngineWorker);
