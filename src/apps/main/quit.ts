import { app, ipcMain } from 'electron';
import { stopSyncEngineWorkers } from './background-processes/sync-engine/services/stop-sync-engine-worker';

export async function quitApp() {
  await stopSyncEngineWorkers();
  app.quit();
}

export function setupQuitHandlers() {
  ipcMain.on('user-quit', quitApp);
}
