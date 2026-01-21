import { getUserOrThrow } from '../auth/service';
import { AuthContext, SyncContext } from '@/apps/sync-engine/config';
import { getRootVirtualDrive } from '../virtual-root-folder/service';
import { spawnSyncEngineWorker } from './sync-engine/services/spawn-sync-engine-worker';
import { unregisterVirtualDrives } from './sync-engine/services/unregister-virtual-drives';
import { spawnWorkspace } from './sync-engine/services/spawn-workspace';
import { getWorkspaces } from './sync-engine/services/get-workspaces';
import { createLogger } from '@/apps/shared/logger/logger';
import { FolderUuid } from '../database/entities/DriveFolder';
import { buildUserEnvironment } from './backups/build-environment';

export async function spawnSyncEngineWorkers({ ctx }: { ctx: AuthContext }) {
  const user = getUserOrThrow();

  const providerId = `{${user.uuid.toUpperCase()}}`;
  const { environment, contentsDownloader } = buildUserEnvironment({ user, type: 'drive' });

  const syncContext: SyncContext = {
    abortController: ctx.abortController,
    bottleneck: ctx.bottleneck,
    client: ctx.client,
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
    environment,
    contentsDownloader,
  };

  const promise = spawnSyncEngineWorker({ ctx: syncContext });

  const workspaces = await getWorkspaces({ ctx });
  const workspaceProviderIds = workspaces.map((workspace) => workspace.providerId);
  const currentProviderIds = workspaceProviderIds.concat([providerId]);

  await unregisterVirtualDrives({ currentProviderIds });

  const promises = workspaces.map((workspace) => spawnWorkspace({ ctx, workspace }));
  await Promise.all([promise, ...promises]);
}
