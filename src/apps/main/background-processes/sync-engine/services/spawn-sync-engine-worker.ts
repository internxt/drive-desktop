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
import { RemoteSyncModule } from '@/backend/features/remote-sync/remote-sync.module';

type TProps = {
  config: Config;
};

let hasPrinted = false;

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

  /**
   * v2.5.6 Daniel Jiménez
   * Since we can have a different status in our local database that in remote,
   * we want to run also this sync in background to update the statuses.
   */
  void RemoteSyncModule.updateItemStatuses({
    rootFolderUuid: config.rootUuid,
    context: config,
  });

  try {
    const browserWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        backgroundThrottling: false,
      },
    });

    /**
     * v2.5.4 Daniel Jiménez
     * We want to print just the first console message of the renderer process.
     * If we print all of them, then we fill the console and the log with duplicated messages.
     * If we do not print any of them and there is an error in the renderer process we do
     * not have any way of knowing what went wrong. Usually the error is printed in the
     * first message.
     */
    browserWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      if (!hasPrinted) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Sync engine worker console message',
          workspaceId,
          level,
          message,
          line,
          sourceId,
        });

        hasPrinted = true;
      }
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
