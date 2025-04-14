import { logger } from '@/apps/shared/logger/logger';
import { workers } from '../store';
import { ipcMain } from 'electron';

type TProps = {
  workspaceId: string;
};

export async function stopAndClearSyncEngineWorker({ workspaceId }: TProps) {
  const worker = workers[workspaceId];

  logger.debug({ msg: '[MAIN] Stop and clear sync engine', workspaceId });

  if (worker && !worker.workerIsRunning) {
    logger.debug({ msg: '[MAIN] Sync engine worker was not running', workspaceId });
    worker.worker?.destroy();
    delete workers[workspaceId];
    return;
  }

  const response = new Promise<void>((resolve, reject) => {
    ipcMain.on('ERROR_ON_STOP_AND_CLEAR_SYNC_ENGINE_PROCESS', (_, error: Error) => {
      logger.error({ msg: '[MAIN] Error stopping sync engine worker', workspaceId, error });
      reject(error);
    });

    ipcMain.on('SYNC_ENGINE_STOP_AND_CLEAR_SUCCESS', () => {
      logger.debug({ msg: '[MAIN] Sync engine stopped and cleared', workspaceId });
      resolve();
    });

    setTimeout(() => {
      reject(new Error('Timeout waiting for sync engine to stop after 10 seconds'));
    }, 10_000);
  });

  try {
    worker.worker?.webContents.send('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS');
    await response;
  } catch (exc) {
    logger.error({
      msg: '[MAIN] Error stopping sync engine worker',
      workspaceId,
      exc,
    });
  } finally {
    worker.worker?.destroy();
    worker.workerIsRunning = false;
    worker.worker = null;
  }
}
