import { loggerService } from '@/apps/shared/logger/logger';
import { ipcMain } from 'electron';
import { workers } from '../../sync-engine';

type Props = {
  workspaceId: string;
};

export class StopAndClearSyncEngineWorkerService {
  constructor(private readonly logger = loggerService) {}

  async run({ workspaceId }: Props) {
    this.logger.debug({ msg: '[MAIN] Stop and clear sync engine worker', workspaceId });

    const worker = workers[workspaceId];

    if (!worker) {
      this.logger.debug({ msg: '[MAIN] The workspace did not have a sync engine worker', workspaceId });
      return;
    }

    if (!worker.workerIsRunning) {
      this.logger.debug({ msg: '[MAIN] Sync engine worker was not running', workspaceId });
      worker.browserWindow?.destroy();
      delete workers[workspaceId];
      return;
    }

    const response = new Promise<void>((resolve, reject) => {
      ipcMain.on('ERROR_ON_STOP_AND_CLEAR_SYNC_ENGINE_PROCESS', (_, exc: Error) => {
        this.logger.error({ msg: '[MAIN] Error stopping sync engine worker', workspaceId, exc });
        reject(exc);
      });

      ipcMain.on('SYNC_ENGINE_STOP_AND_CLEAR_SUCCESS', () => {
        this.logger.debug({ msg: '[MAIN] Sync engine stopped and cleared', workspaceId });
        resolve();
      });

      const millisecondsToWait = 10_000;

      setTimeout(() => {
        reject(new Error(`Timeout waiting for sync engine to stop after ${millisecondsToWait} milliseconds`));
      }, millisecondsToWait);
    });

    try {
      worker.browserWindow?.webContents?.send('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS');
      await response;
    } catch (exc) {
      this.logger.error({ msg: '[MAIN] Timeout waiting for sync engine to stop', exc });
    } finally {
      worker.browserWindow?.destroy();
      worker.workerIsRunning = false;
      worker.browserWindow = null;
    }
  }
}
