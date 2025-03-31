import { Config } from '@/apps/sync-engine/config';
import { loggerService } from '@/apps/shared/logger/logger';
import { BrowserWindow } from 'electron';
import path from 'path';
import { cwd } from 'process';
import { workers } from '../store';
import { MonitorHealthService } from './monitor-health.service';
import { ScheduleSyncService } from './schedule-sync.service';
import { StopAndClearSyncEngineWorkerService } from './stop-and-clear-sync-engine-worker.service';

type TProps = {
  config: Config;
};

export class SpawnSyncEngineWorkerService {
  constructor(
    private readonly monitorHealth = new MonitorHealthService(),
    private readonly scheduleSync = new ScheduleSyncService(),
    private readonly stopAndClearSyncEngineWorker = new StopAndClearSyncEngineWorkerService(),
    private readonly logger = loggerService,
  ) {}

  async run({ config }: TProps) {
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
      this.logger.debug({ msg: '[MAIN] Sync engine worker is already starting', workspaceId });
      return;
    }

    if (worker.workerIsRunning) {
      this.logger.debug({ msg: '[MAIN] Sync engine worker is already running', workspaceId });
      return;
    }

    this.logger.debug({ msg: '[MAIN] Spawn sync engine worker', workspaceId });

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
          ? path.join(cwd(), 'dist', 'sync-engine', 'index.html')
          : path.join(__dirname, '..', 'sync-engine', 'index.html'),
      );

      this.logger.debug({ msg: '[MAIN] Browser window loaded', workspaceId });

      browserWindow.webContents.send('SET_CONFIG', config);

      this.monitorHealth.run({
        browserWindow,
        stopAndSpawn: async () => {
          await this.stopAndClearSyncEngineWorker.run({ workspaceId });
          await this.run({ config });
        },
      });

      this.scheduleSync.run({ worker });

      worker.worker = browserWindow;
    } catch (exc) {
      this.logger.error({
        msg: '[MAIN] Error loading sync engine worker for workspace',
        workspaceId,
        exc,
      });
    }
  }
}
