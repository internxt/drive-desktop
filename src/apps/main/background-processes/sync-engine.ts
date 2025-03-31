import { ipcMain } from 'electron';
import Logger from 'electron-log';
import eventBus from '../event-bus';
import { workers } from './sync-engine/store';
import { getUser } from '../auth/service';
import { Config } from '@/apps/sync-engine/config';
import { getLoggersPaths, getRootVirtualDrive } from '../virtual-root-folder/service';
import { SpawnSyncEngineWorkerService } from './sync-engine/services/spawn-sync-engine-worker.service';
import { SpawnWorkspacesService } from './sync-engine/services/spawn-workspaces.service';
import { stopAndClearSyncEngineWorker } from './sync-engine/services/stop-and-clear-sync-engine-worker.service';

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

export function updateSyncEngine(workspaceId: string) {
  try {
    const worker = workers[workspaceId]?.worker;
    if (worker && !worker.isDestroyed() && worker.webContents && !worker.webContents.isDestroyed()) {
      worker.webContents?.send('UPDATE_SYNC_ENGINE_PROCESS');
    }
  } catch (err) {
    Logger.error(err);
  }
}

export function fallbackSyncEngine(workspaceId: string) {
  try {
    const worker = workers[workspaceId]?.worker;
    if (worker && !worker.isDestroyed() && worker.webContents && !worker.webContents.isDestroyed()) {
      worker?.webContents?.send('FALLBACK_SYNC_ENGINE_PROCESS');
    }
  } catch (err) {
    Logger.error(err);
  }
}

export async function sendUpdateFilesInSyncPending(workspaceId: string): Promise<string[]> {
  try {
    const worker = workers[workspaceId]?.worker;
    if (worker && !worker.isDestroyed() && worker.webContents && !worker.webContents.isDestroyed()) {
      worker?.webContents?.send('UPDATE_UNSYNC_FILE_IN_SYNC_ENGINE_PROCESS');
    }
    return [];
  } catch (err) {
    Logger.error(err);
    return [];
  }
}

export const stopAndClearAllSyncEngineWatcher = async () => {
  await Promise.all(
    Object.keys(workers).map(async (workspaceId) => {
      await stopAndClearSyncEngineWorker({ workspaceId });
    }),
  );
};

export const spawnAllSyncEngineWorker = async () => {
  const user = getUser();

  if (!user) {
    return;
  }

  const config: Config = {
    providerId: `{${process.env.PROVIDER_ID}}`,
    rootPath: getRootVirtualDrive(),
    providerName: 'Internxt Drive',
    workspaceId: '',
    loggerPath: getLoggersPaths().logEnginePath,
    rootUuid: user.rootFolderId,
    mnemonic: user.mnemonic,
    bucket: user.bucket,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    workspaceToken: undefined,
  };

  await new SpawnSyncEngineWorkerService().run({ config });
  await new SpawnWorkspacesService().run({});
};

eventBus.on('USER_LOGGED_OUT', stopAndClearAllSyncEngineWatcher);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearAllSyncEngineWatcher);
