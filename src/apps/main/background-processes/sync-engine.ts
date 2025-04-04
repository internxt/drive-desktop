import { ipcMain } from 'electron';
import Logger from 'electron-log';
import eventBus from '../event-bus';
import { workers } from './sync-engine/store';
import { getUser } from '../auth/service';
import { Config } from '@/apps/sync-engine/config';
import { getLoggersPaths, getRootVirtualDrive } from '../virtual-root-folder/service';
import { stopAndClearSyncEngineWorker } from './sync-engine/services/stop-and-clear-sync-engine-worker';
import { spawnSyncEngineWorker } from './sync-engine/services/spawn-sync-engine-worker';
import { unregisterVirtualDrives } from './sync-engine/services/unregister-virtual-drives';
import { spawnWorkspace } from './sync-engine/services/spawn-workspace';
import { getWorkspaces } from './sync-engine/services/get-workspaces';
import { initializeRemoteSyncManager } from '../remote-sync/handlers';

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

  const providerId = `{${user.uuid.toUpperCase()}}`;
  const config: Config = {
    providerId,
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

  const workspaces = await getWorkspaces({});
  const workspaceProviderIds = workspaces.map((workspace) => workspace.providerId);

  unregisterVirtualDrives({ providerId, workspaceProviderIds });

  const spawnWorkspaces = workspaces.forEach(async (workspace) => {
    initializeRemoteSyncManager({ workspaceId: workspace.id });
    await spawnWorkspace({ workspace });
  });

  await Promise.all([spawnSyncEngineWorker({ config }), spawnWorkspaces]);
};

eventBus.on('USER_LOGGED_OUT', stopAndClearAllSyncEngineWatcher);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearAllSyncEngineWatcher);
