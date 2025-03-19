import { logger } from '@/apps/shared/logger/logger';
import { BrowserWindow } from 'electron';

type Props = {
  browserWindow: BrowserWindow;
  stopAndSpawn: () => Promise<void>;
};

export class MonitorHealthService {
  async run({ browserWindow, stopAndSpawn }: Props) {
    const pid = browserWindow.webContents.getOSProcessId();

    async function checkWorkerHealth() {
      try {
        process.kill(pid, 0);
        logger.debug({ msg: '[MAIN] Sync engine worker is still running' });
      } catch (err) {
        logger.error({ msg: '[MAIN] Sync engine worker is dead' });
        await stopAndSpawn();
      }
    }

    // If we keep this event, then when the process is closed, stopAndSpawn is called two times
    // We need to make more stable the variables of startingWorker and workerIsRunning before activating this event
    // browserWindow.on('closed', async () => {
    //   Logger.error('[MAIN] Sync engine worker closed');
    //   await stopAndSpawn();
    // });

    browserWindow.webContents.on('render-process-gone', async () => {
      logger.error({ msg: '[MAIN] Sync engine worker process gone' });
      await stopAndSpawn();
    });

    browserWindow.webContents.on('unresponsive', async () => {
      logger.error({ msg: '[MAIN] Sync engine worker unresponsive' });
      await checkWorkerHealth();
    });
  }
}
