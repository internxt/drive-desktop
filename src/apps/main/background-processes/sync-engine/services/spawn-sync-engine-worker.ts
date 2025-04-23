import { Config } from '@/apps/sync-engine/config';
import { BrowserWindow } from 'electron';
import path from 'path';
import { cwd } from 'process';
import { workers } from '../store';
import { stopAndClearSyncEngineWorker } from './stop-and-clear-sync-engine-worker';
import { monitorHealth } from './monitor-health';
import { logger } from '@/apps/shared/logger/logger';
import { scheduleSync } from './schedule-sync';
import { addRemoteSyncManager } from '@/apps/main/remote-sync/handlers';

type TProps = {
  config: Config;
};

export async function spawnSyncEngineWorker({ config }: TProps) {
  const workspaceId = config.workspaceId;

  if (!workers[workspaceId]) {
    workers[workspaceId] = {
      worker: null,
      workerIsRunning: false,
      startingWorker: false,
      syncSchedule: null,
    };
  }

  const worker = workers[workspaceId];

  if (worker.startingWorker) {
    logger.debug({ msg: '[MAIN] Sync engine worker is already starting', workspaceId });
    return;
  }

  if (worker.workerIsRunning) {
    logger.debug({ msg: '[MAIN] Sync engine worker is already running', workspaceId });
    return;
  }

  logger.debug({ msg: '[MAIN] Spawn sync engine worker', workspaceId });

  try {
    const browserWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        backgroundThrottling: false,
      },
    });

    worker.startingWorker = true;
    worker.worker = browserWindow;

    await browserWindow.loadFile(
      process.env.NODE_ENV === 'development'
        ? path.join(cwd(), 'dist', 'sync-engine', 'index.html')
        : path.join(__dirname, '..', 'sync-engine', 'index.html'),
    );

    logger.debug({ msg: '[MAIN] Browser window loaded', workspaceId });

    browserWindow.webContents.send('SET_CONFIG', config);

    monitorHealth({
      browserWindow,
      stopAndSpawn: async () => {
        await stopAndClearSyncEngineWorker({ workspaceId });
        await spawnSyncEngineWorker({ config });
      },
    });

    scheduleSync({ worker });

    addRemoteSyncManager({ workspaceId, worker });
  } catch (exc) {
    logger.error({
      msg: '[MAIN] Error loading sync engine worker for workspace',
      workspaceId,
      exc,
    });
  }
}
