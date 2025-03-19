import { app, ipcMain } from 'electron';
import { StopAndClearAllSyncEngineWorkersService } from './background-processes/sync-engine/in/stop-and-clear-all-sync-engine-workers.service';

export async function quitApp() {
  await new StopAndClearAllSyncEngineWorkersService().run();
  app.quit();
}

export function setupQuitHandlers() {
  ipcMain.on('user-quit', quitApp);
}
