import { app, ipcMain } from 'electron';
import { stopAndClearAllSyncEngineWatcher } from './background-processes/sync-engine';
import { unregisterVirtualDrives } from './background-processes/sync-engine/services/unregister-virtual-drives';

export async function quitApp() {
  await stopAndClearAllSyncEngineWatcher();
  unregisterVirtualDrives({});
  app.quit();
}

export function setupQuitHandlers() {
  ipcMain.on('user-quit', quitApp);
}
