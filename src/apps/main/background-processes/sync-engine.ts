import { ipcMain } from 'electron';
import Logger from 'electron-log';
import eventBus from '../event-bus';
import { StopAndClearAllSyncEngineWorkersService } from './sync-engine/stop-and-clear-all-sync-engine-workers.service';
import { WorkerConfig } from './sync-engine/spawn-sync-engine-worker.service';
import { getDIContainer } from '@/core/dependency-injection/container';

export const workers: { [key: string]: WorkerConfig } = {};

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

export async function sendUpdateFilesInSyncPending(workspaceId: string): Promise<string[]> {
  try {
    const browserWindow = workers[workspaceId]?.browserWindow;
    if (browserWindow && !browserWindow.isDestroyed() && !browserWindow.webContents.isDestroyed()) {
      browserWindow.webContents.send('UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE_PROCESS');
    }
  } catch (err) {
    Logger.error(err);
  }

  return [];
}

eventBus.on('USER_LOGGED_OUT', async () => {
  const container = getDIContainer();
  const service = container.get(StopAndClearAllSyncEngineWorkersService);
  await service.run();
});

eventBus.on('USER_WAS_UNAUTHORIZED', async () => {
  const container = getDIContainer();
  const service = container.get(StopAndClearAllSyncEngineWorkersService);
  await service.run();
});
