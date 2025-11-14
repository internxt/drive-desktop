import { app, ipcMain } from 'electron';
import { cleanSyncEngineWorkers } from './background-processes/sync-engine/services/stop-sync-engine-worker';

export async function quitApp() {
  await cleanSyncEngineWorkers();
  app.quit();
}

export function setupQuitHandlers() {
  ipcMain.on('user-quit', quitApp);
}
