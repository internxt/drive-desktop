import { logger } from '@/apps/shared/logger/logger';
import { Config } from '@/apps/sync-engine/config';
import { BrowserWindow } from 'electron';
import nodeSchedule from 'node-schedule';
import path from 'path';
import { cwd } from 'process';
import { MonitorHealthService } from './monitor-health.service';
import { ScheduleRemoteSyncService } from './schedule-remote-sync.service';
import { workers } from '../../sync-engine';
import { StopAndClearSyncEngineWorkerService } from './stop-and-clear-sync-engine-worker.service';

export type WorkerConfig = {
  browserWindow: BrowserWindow | null;
  workerIsRunning: boolean;
  startingWorker: boolean;
  syncSchedule: nodeSchedule.Job | null;
};

type Props = {
  config: Config;
};

export class SpawnSyncEngineWorkerService {
  constructor(
    private readonly monitorHealth = new MonitorHealthService(),
    private readonly stopAndClearSyncEngineWorker = new StopAndClearSyncEngineWorkerService(),
    private readonly scheduleRemoteSync = new ScheduleRemoteSyncService(),
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
      logger.debug({ msg: '[MAIN] Sync engine worker is already starting', providerName, workspaceId });
      return;
    }

    if (worker.workerIsRunning) {
      logger.info({ msg: '[MAIN] Sync engine worker is already running', providerName, workspaceId });
      return;
    }

    logger.debug({ msg: '[MAIN] Spawing sync engine worker', providerName, workspaceId });
    worker.startingWorker = true;

    const browserWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        backgroundThrottling: false,
      },
    });

    try {
      await browserWindow.loadFile(
        process.env.NODE_ENV === 'development'
          ? path.join(cwd(), 'release', 'app', 'dist', 'sync-engine', 'index.html')
          : path.join(__dirname, '..', 'sync-engine', 'index.html'),
      );

      logger.debug({ msg: '[MAIN] Sync engine worker loaded', providerName, workspaceId });

      browserWindow.webContents.send('SET_CONFIG', config);

      this.monitorHealth.run({
        browserWindow,
        stopAndSpawn: async () => {
          await this.stopAndClearSyncEngineWorker.run({ workspaceId });
          await this.run({ config });
        },
      });

      this.scheduleRemoteSync.run({ worker });

      worker.browserWindow = browserWindow;
    } catch (exc) {
      logger.error({
        msg: '[MAIN] Error loading sync engine worker',
        providerName,
        workspaceId,
        exc,
      });
    }
  }
}
