import { workers } from '../remote-sync/store';
import { SyncContext } from '@/apps/sync-engine/config';
import { getRootVirtualDrive } from '../virtual-root-folder/service';
import { spawnSyncEngineWorker } from './sync-engine/services/spawn-sync-engine-worker';
import { unregisterVirtualDrives } from './sync-engine/services/unregister-virtual-drives';
import { spawnWorkspace } from './sync-engine/services/spawn-workspace';
import { getWorkspaces } from './sync-engine/services/get-workspaces';
import { AuthContext } from '@/backend/features/auth/utils/context';
import { createLogger } from '@/apps/shared/logger/logger';
import { FolderUuid } from '../database/entities/DriveFolder';

export function updateSyncEngine(workspaceId: string) {
  const worker = workers.get(workspaceId);
  if (worker) {
    worker.browserWindow.webContents.send('UPDATE_SYNC_ENGINE_PROCESS');
  }
}

export async function spawnSyncEngineWorkers({ ctx }: { ctx: AuthContext }) {
  const { user } = ctx;

  const providerId = `{${user.uuid.toUpperCase()}}`;
  const syncContext: SyncContext = {
    ...ctx,
    userUuid: user.uuid,
    providerId,
    rootPath: await getRootVirtualDrive(),
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

  const promises = workspaces.map((workspace) => spawnWorkspace({ ctx, workspace }));
  await Promise.all([spawnSyncEngineWorker({ ctx: syncContext }), promises]);
}
