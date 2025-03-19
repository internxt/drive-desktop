import { ipcMain } from 'electron';
import { logger } from '@/apps/shared/logger/logger';
import { workers } from '../../sync-engine';

export class SyncEngineIpcService {
  run() {
    ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL', (event, workspaceId = '') => {
      logger.debug({ msg: '[MAIN] Sync engine worker running', workspaceId });
      if (workers[workspaceId]) {
        workers[workspaceId].workerIsRunning = true;
        workers[workspaceId].startingWorker = false;
      }
    });

    ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_FAILED', (event, workspaceId) => {
      logger.debug({ msg: '[MAIN] Sync engine worker failed', workspaceId });
      if (workers[workspaceId]) {
        workers[workspaceId].workerIsRunning = false;
        workers[workspaceId].startingWorker = false;
      }
    });
  }
}
