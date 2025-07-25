import { SyncContext } from '@/apps/sync-engine/config';
import { decryptMessageWithPrivateKey } from '@/apps/shared/crypto/service';
import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { PATHS } from '@/core/electron/paths';
import { join } from 'path';
import { AuthContext } from '@/backend/features/auth/utils/context';

type TProps = {
  context: AuthContext;
  workspace: {
    id: string;
    mnemonic: string;
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

  const mnemonic = await decryptMessageWithPrivateKey({
    encryptedMessage: Buffer.from(workspace.mnemonic, 'base64').toString(),
    privateKeyInBase64: user.privateKey,
  });

  const syncContext: SyncContext = {
    ...context,
    userUuid: user.uuid,
    mnemonic: mnemonic.toString(),
    providerId: workspace.providerId,
    rootPath: workspace.rootPath,
    providerName: 'Internxt Drive for Business',
    loggerPath: join(PATHS.LOGS, `node-win-workspace-${workspace.id}.log`),
    queueManagerPath: join(PATHS.LOGS, `queue-manager-workspace-${workspace.id}.log`),
    workspaceId: workspace.id,
    workspaceToken: credentials.tokenHeader,
    rootUuid: workspace.rootFolderId,
    bucket: credentials.bucket,
    bridgeUser: credentials.credentials.networkUser,
    bridgePass: credentials.credentials.networkPass,
  };

  await spawnSyncEngineWorker({ context: syncContext });
}
