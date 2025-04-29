import { ipcMain } from 'electron';
import Logger from 'electron-log';
import eventBus from '../event-bus';
import { workers } from './sync-engine/store';
import { getUserOrThrow } from '../auth/service';
import { Config } from '@/apps/sync-engine/config';
import { getRootVirtualDrive } from '../virtual-root-folder/service';
import { stopAndClearSyncEngineWorker } from './sync-engine/services/stop-and-clear-sync-engine-worker';
import { spawnSyncEngineWorker } from './sync-engine/services/spawn-sync-engine-worker';
import { unregisterVirtualDrives } from './sync-engine/services/unregister-virtual-drives';
import { spawnWorkspace } from './sync-engine/services/spawn-workspace';
import { getWorkspaces } from './sync-engine/services/get-workspaces';
import { PATHS } from '@/core/electron/paths';
import { join } from 'path';
import { FolderStore } from '../remote-sync/sync-engine/folders/folder-store';

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
    const browserWindow = workers[workspaceId]?.worker;
    if (browserWindow && !browserWindow.isDestroyed() && !browserWindow.webContents.isDestroyed()) {
      browserWindow.webContents.send('UPDATE_SYNC_ENGINE_PROCESS');
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

export async function spawnDefaultSyncEngineWorker() {
  const user = getUserOrThrow();

  const providerId = `{${user.uuid.toUpperCase()}}`;
  const config: Config = {
    providerId,
    rootPath: getRootVirtualDrive(),
    providerName: 'Internxt Drive',
    workspaceId: '',
    loggerPath: join(PATHS.LOGS, 'node-win.log'),
    rootUuid: user.rootFolderId,
    mnemonic: user.mnemonic,
    bucket: user.bucket,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    workspaceToken: undefined,
  };

  FolderStore.addWorkspace({
    workspaceId: '',
    rootId: user.root_folder_id,
    rootUuid: user.rootFolderId,
  });

  await spawnSyncEngineWorker({ config });

  return { providerId };
}

export async function spawnWorkspaceSyncEngineWorkers({ providerId }: { providerId: string }) {
  const workspaces = await getWorkspaces({});
  const workspaceProviderIds = workspaces.map((workspace) => workspace.providerId);

  const currentProviderIds = workspaceProviderIds.concat([providerId]);

  unregisterVirtualDrives({ currentProviderIds });

  const spawnWorkspaces = workspaces.map(async (workspace) => {
    FolderStore.addWorkspace({
      workspaceId: workspace.id,
      rootId: null,
      rootUuid: workspace.rootFolderId,
    });

    await spawnWorkspace({ workspace });
  });

  await Promise.all(spawnWorkspaces);
}

eventBus.on('USER_LOGGED_OUT', stopAndClearAllSyncEngineWatcher);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearAllSyncEngineWatcher);
