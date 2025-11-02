import { SyncContext } from '@/apps/sync-engine/config';
import { decryptMessageWithPrivateKey } from '@/apps/shared/crypto/service';
import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { createLogger, logger } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { PATHS } from '@/core/electron/paths';
import { join } from 'node:path';
import { AuthContext } from '@/backend/features/auth/utils/context';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type TProps = {
  context: AuthContext;
  workspace: {
    id: string;
    key: string;
    providerId: string;
    rootFolderId: string;
    rootPath: string;
  };
};

export async function spawnWorkspace({ context, workspace }: TProps) {
  logger.debug({ msg: 'Spawn workspace', workspaceId: workspace.id });

  const { data: credentials, error } = await driveServerWipModule.workspaces.getCredentials({ workspaceId: workspace.id });

  if (error) return;

  const user = getUserOrThrow();

  try {
    const mnemonic = await decryptMessageWithPrivateKey({
      encryptedMessage: Buffer.from(workspace.key, 'base64').toString(),
      privateKeyInBase64: user.privateKey,
    });

    const syncCtx: SyncContext = {
      ...context,
      userUuid: user.uuid,
      mnemonic,
      providerId: workspace.providerId,
      rootPath: workspace.rootPath,
      providerName: 'Internxt Drive for Business',
      workspaceId: workspace.id,
      workspaceToken: credentials.tokenHeader,
      rootUuid: workspace.rootFolderId as FolderUuid,
      bucket: credentials.bucket,
      bridgeUser: credentials.credentials.networkUser,
      bridgePass: credentials.credentials.networkPass,
      logger: createLogger({ tag: 'SYNC-ENGINE', workspaceId: workspace.id }),
    };

    await spawnSyncEngineWorker({ ctx: syncCtx });
  } catch (exc) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error spawning workspace', exc });
  }
}
