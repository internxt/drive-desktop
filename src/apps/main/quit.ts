import { app, ipcMain } from 'electron';
import { stopAndClearAllSyncEngineWatcher } from './background-processes/sync-engine';

export async function quitApp() {
  await stopAndClearAllSyncEngineWatcher();
  app.quit();
}

export function setupQuitHandlers() {
  ipcMain.on('user-quit', quitApp);
}
