import { BrowserWindow } from 'electron';
import { WorkerConfig } from './sync-engine/in/spawn-sync-engine-worker.service';
import { SyncEngineIpcService } from './sync-engine/out/sync-engine-ipc.service';
import { SyncEngineEventBusService } from './sync-engine/out/sync-engine-event-bus.service';

export const workers: { [key: string]: WorkerConfig } = {};

function getBrowserWindow(workspaceId: string): BrowserWindow | null {
  const browserWindow = workers[workspaceId]?.browserWindow;

  if (browserWindow && !browserWindow.isDestroyed() && !browserWindow.webContents.isDestroyed()) {
    return browserWindow;
  } else {
    return null;
  }
}

export async function sendUpdateFilesInSyncPending(workspaceId: string) {
  const browserWindow = getBrowserWindow(workspaceId);
  browserWindow?.webContents.send('UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE_PROCESS');
}

export function updateSyncEngine(workspaceId: string) {
  const browserWindow = getBrowserWindow(workspaceId);
  browserWindow?.webContents.send('UPDATE_SYNC_ENGINE_PROCESS');
}

export function fallbackSyncEngine(workspaceId: string) {
  const browserWindow = getBrowserWindow(workspaceId);
  browserWindow?.webContents.send('FALLBACK_SYNC_ENGINE_PROCESS');
}

new SyncEngineIpcService().run();
new SyncEngineEventBusService().run();
