import { ipcMain } from 'electron';
import eventBus from '../event-bus';
import { workers } from './sync-engine/store';
import { getUserOrThrow } from '../auth/service';
import { SyncContext } from '@/apps/sync-engine/config';
import { getRootVirtualDrive } from '../virtual-root-folder/service';
import { stopAndClearSyncEngineWorker } from './sync-engine/services/stop-and-clear-sync-engine-worker';
import { spawnSyncEngineWorker } from './sync-engine/services/spawn-sync-engine-worker';
import { unregisterVirtualDrives } from './sync-engine/services/unregister-virtual-drives';
import { spawnWorkspace } from './sync-engine/services/spawn-workspace';
import { getWorkspaces } from './sync-engine/services/get-workspaces';
import { PATHS } from '@/core/electron/paths';
import { join } from 'path';
import { AuthContext } from '@/backend/features/auth/utils/context';
import { logger } from '@/apps/shared/logger/logger';

ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL', (event, workspaceId = '') => {
  logger.debug({ msg: 'SYNC ENGINE RUNNING for workspace', workspaceId });
  if (workers[workspaceId]) {
    workers[workspaceId].workerIsRunning = true;
    workers[workspaceId].startingWorker = false;
  }
});

ipcMain.on('SYNC_ENGINE_PROCESS_SETUP_FAILED', (event, workspaceId) => {
  logger.debug({ msg: 'SYNC ENGINE FAILED for workspace', workspaceId });
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
    logger.error({ msg: 'Error updating sync engine', error: err });
  }
}

export const stopAndClearAllSyncEngineWatcher = async () => {
  await Promise.all(
    Object.keys(workers).map(async (workspaceId) => {
      await stopAndClearSyncEngineWorker({ workspaceId });
    }),
  );
};

export async function spawnDefaultSyncEngineWorker({ context }: { context: AuthContext }) {
  const user = getUserOrThrow();

  const providerId = `{${user.uuid.toUpperCase()}}`;
  const syncContext: SyncContext = {
    ...context,
    userUuid: user.uuid,
    providerId,
    rootPath: getRootVirtualDrive(),
    providerName: 'Internxt Drive',
    workspaceId: '',
    loggerPath: join(PATHS.LOGS, 'node-win.log'),
    queueManagerPath: join(PATHS.LOGS, `queue-manager-user-${user.uuid}.log`),
    rootUuid: user.rootFolderId,
    mnemonic: user.mnemonic,
    bucket: user.bucket,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    workspaceToken: '',
  };

  await spawnSyncEngineWorker({ context: syncContext });

  return { providerId };
}

export async function spawnWorkspaceSyncEngineWorkers({ context, providerId }: { context: AuthContext; providerId: string }) {
  const workspaces = await getWorkspaces();
  const workspaceProviderIds = workspaces.map((workspace) => workspace.providerId);

  const currentProviderIds = workspaceProviderIds.concat([providerId]);

  unregisterVirtualDrives({ currentProviderIds });

  const spawnWorkspaces = workspaces.map(async (workspace) => {
    await spawnWorkspace({ context, workspace });
  });

  await Promise.all(spawnWorkspaces);
}

eventBus.on('USER_LOGGED_OUT', stopAndClearAllSyncEngineWatcher);
