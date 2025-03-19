import { logger } from '@/apps/shared/logger/logger';
import { Config } from '@/apps/sync-engine/config';
import { Service } from 'diod';
import { BrowserWindow } from 'electron';
import nodeSchedule from 'node-schedule';
import path from 'path';
import { cwd } from 'process';
import { MonitorHealthService } from './monitor-health.service';
import { updateRemoteSync } from '../../remote-sync/handlers';
import { StopAndClearSyncEngineWorkerService } from './stop-and-clear-sync-engine-worker.service';
import { workers } from '../sync-engine';

export type WorkerConfig = {
  browserWindow: BrowserWindow | null;
  workerIsRunning: boolean;
  startingWorker: boolean;
  syncSchedule: nodeSchedule.Job | null;
};

type Props = {
  config: Config;
};

@Service()
export class SpawnSyncEngineWorkerService {
  constructor(
    private readonly monitorHealth: MonitorHealthService,
    private readonly stopAndClearSyncEngineWorker: StopAndClearSyncEngineWorkerService,
  ) {}

  async run({ config }: Props) {
    const { workspaceId, providerName } = config;

    if (!workers[workspaceId]) {
      workers[workspaceId] = {
        browserWindow: null,
        workerIsRunning: false,
        startingWorker: false,
        syncSchedule: null,
      };
    }

    const worker = workers[workspaceId];

    if (worker.startingWorker) {
      logger.debug({ msg: `[MAIN] Worker for drive ${providerName}: ${workspaceId} is already starting` });
      return;
    }

    if (worker.workerIsRunning) {
      logger.info({ msg: `[MAIN] Worker for drive ${providerName}: ${workspaceId} is already running` });
      return;
    }

    logger.debug({ msg: `[MAIN] SPAWNING SYNC ENGINE WORKER for workspace ${providerName}: ${workspaceId}...` });
    worker.startingWorker = true;

    const browserWindow = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        backgroundThrottling: false,
      },
      show: false,
    });

    try {
      await browserWindow.loadFile(
        process.env.NODE_ENV === 'development'
          ? path.join(cwd(), 'release', 'app', 'dist', 'sync-engine', 'index.html')
          : path.join(__dirname, '..', 'sync-engine', 'index.html'),
      );

      logger.debug({ msg: `[MAIN] SYNC ENGINE WORKER for workspace ${providerName}: ${workspaceId} LOADED` });

      browserWindow.webContents.send('SET_CONFIG', config);

      this.monitorHealth.run({
        browserWindow,
        stopAndSpawn: async () => {
          await this.stopAndClearSyncEngineWorker.run({ workspaceId });
          await this.run({ config });
        },
      });

      if (worker.syncSchedule) {
        workers[workspaceId].syncSchedule?.cancel(false);
      }

      worker.syncSchedule = nodeSchedule.scheduleJob('0 0 */2 * * *', async () => {
        logger.debug({ msg: 'Received remote changes event' });
        await updateRemoteSync();
      });

      worker.browserWindow = browserWindow;
    } catch (exc) {
      logger.error({
        msg: `[MAIN] Error loading sync engine worker for workspace ${providerName}: ${workspaceId}`,
        exc,
      });
    }
  }
}
