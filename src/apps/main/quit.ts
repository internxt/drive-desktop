import { app, ipcMain } from 'electron';
import { stopSyncEngineWorkers } from './background-processes/sync-engine/services/stop-sync-engine-worker';

export function quitApp() {
  stopSyncEngineWorkers();
  app.quit();
}

export function setupQuitHandlers() {
  ipcMain.on('user-quit', quitApp);
}
