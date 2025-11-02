import eventBus from '../event-bus';
import { workers } from '../remote-sync/store';
import { getUserOrThrow } from '../auth/service';
import { SyncContext } from '@/apps/sync-engine/config';
import { getRootVirtualDrive } from '../virtual-root-folder/service';
import { stopSyncEngineWorkers } from './sync-engine/services/stop-sync-engine-worker';
import { spawnSyncEngineWorker } from './sync-engine/services/spawn-sync-engine-worker';
import { unregisterVirtualDrives } from './sync-engine/services/unregister-virtual-drives';
import { spawnWorkspace } from './sync-engine/services/spawn-workspace';
import { getWorkspaces } from './sync-engine/services/get-workspaces';
import { PATHS } from '@/core/electron/paths';
import { join } from 'node:path';
import { AuthContext } from '@/backend/features/auth/utils/context';
import { createLogger } from '@/apps/shared/logger/logger';
import { FolderUuid } from '../database/entities/DriveFolder';

export function updateSyncEngine(workspaceId: string) {
  const worker = workers.get(workspaceId);
  if (worker) {
    worker.browserWindow.webContents.send('UPDATE_SYNC_ENGINE_PROCESS');
  }
}

export async function spawnSyncEngineWorkers({ context }: { context: AuthContext }) {
  const user = getUserOrThrow();

  const providerId = `{${user.uuid.toUpperCase()}}`;
  const syncContext: SyncContext = {
    ...context,
    userUuid: user.uuid,
    providerId,
    rootPath: getRootVirtualDrive(),
    providerName: 'Internxt Drive',
    workspaceId: '',
    rootUuid: user.rootFolderId as FolderUuid,
    mnemonic: user.mnemonic,
    bucket: user.bucket,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    workspaceToken: '',
    logger: createLogger({ tag: 'SYNC-ENGINE' }),
  };

  const workspaces = await getWorkspaces();
  const workspaceProviderIds = workspaces.map((workspace) => workspace.providerId);
  const currentProviderIds = workspaceProviderIds.concat([providerId]);

  unregisterVirtualDrives({ currentProviderIds });

  const promises = workspaces.map((workspace) => spawnWorkspace({ context, workspace }));
  await Promise.all([spawnSyncEngineWorker({ ctx: syncContext }), promises]);
}

eventBus.on('USER_LOGGED_OUT', stopSyncEngineWorkers);
