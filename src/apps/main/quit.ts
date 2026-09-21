import { logger } from '@internxt/drive-desktop-core/build/backend';
import { app, ipcMain } from 'electron';
import { stopMailBridge } from '@/backend/features/mail-bridge';
import { cleanSyncEngineWorkers } from './background-processes/sync-engine/services/stop-sync-engine-worker';

export const QUIT_FLAG = '--quit';

export async function quitApp() {
  logger.debug({ msg: 'Quit app' });
  await stopMailBridge();
  await cleanSyncEngineWorkers();
  app.quit();
}

export function setupQuitHandlers() {
  ipcMain.on('user-quit', quitApp);
}
