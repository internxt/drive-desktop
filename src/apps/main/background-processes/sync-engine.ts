import { createLogger } from '@/apps/shared/logger/logger';
import { AuthContext, SyncContext } from '@/apps/sync-engine/config';
import { FolderUuid } from '../database/entities/DriveFolder';
import { getRootVirtualDrive } from '../virtual-root-folder/service';
import { buildDriveEnvironment } from './backups/build-environment';
import { getWorkspaces } from './sync-engine/services/get-workspaces';
import { spawnSyncEngineWorker } from './sync-engine/services/spawn-sync-engine-worker';
import { spawnWorkspace } from './sync-engine/services/spawn-workspace';
import { unregisterVirtualDrives } from './sync-engine/services/unregister-virtual-drives';

export async function spawnSyncEngineWorkers({ ctx }: { ctx: AuthContext }) {
  const { providerId, promise } = await spawnDrive({ ctx });

  const workspaces = await getWorkspaces({ ctx });
  const workspaceProviderIds = workspaces.map((workspace) => workspace.providerId);
  const currentProviderIds = workspaceProviderIds.concat([providerId]);

  await unregisterVirtualDrives({ currentProviderIds });

  const promises = workspaces.map((workspace) => spawnWorkspace({ ctx, workspace }));
  await Promise.all([promise, ...promises]);
}

export async function spawnDrive({ ctx }: { ctx: AuthContext }) {
  const { user } = ctx;
  const { config, environment, contentsDownloader } = buildDriveEnvironment({ user });
  const providerId = `{${user.uuid.toUpperCase()}}`;

  const syncContext: SyncContext = {
    ...ctx,
    status: 'IDLE',
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
    environmentConfig: config,
    environment,
    contentsDownloader,
  };

  const promise = spawnSyncEngineWorker({ ctx: syncContext });
  return { providerId, promise };
}
