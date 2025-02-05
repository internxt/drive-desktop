import { BrowserWindow } from 'electron';
import Logger from 'electron-log';

export const monitorHealth = async ({ worker, stopAndSpawn }: { worker: BrowserWindow, stopAndSpawn: () => Promise<void> }) => {
  // If we keep this event, then when the process is closed, stopAndSpawn is called two times
  // worker.on('closed', async () => {
  //   Logger.error('[MAIN] Sync engine worker closed');
  //   await stopAndSpawn();
  // });

  worker.webContents.on('render-process-gone', async () => {
    Logger.error('[MAIN] Sync engine worker process gone');
    await stopAndSpawn();
  });

  worker.webContents.on('unresponsive', async () => {
    Logger.error('[MAIN] Sync engine worker unresponsive');
    await checkWorkerHealth();
  });

  const checkWorkerHealth = async () => {
    if (worker && worker.webContents.getOSProcessId()) {
      const pid = worker.webContents.getOSProcessId();
      try {
        process.kill(pid, 0);
        Logger.error('[MAIN] Sync engine worker is still running');
      } catch (err) {
        Logger.error('[MAIN] Sync engine worker is dead');
        await stopAndSpawn();
      }
    }
  };
};
