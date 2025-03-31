import { Config } from '@/apps/sync-engine/config';
import { getLoggersPaths, getRootWorkspace } from '@/apps/main/virtual-root-folder/service';
import { decryptMessageWithPrivateKey } from '@/apps/shared/crypto/service';
import { spawnSyncEngineWorker } from './spawn-sync-engine-worker.service';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getUserOrThrow } from '@/apps/main/auth/service';

type TProps = {
  retry?: number;
  workspace: {
    id: string;
    mnemonic: string;
    rootFolderId: string;
  };
};

export async function spawnWorkspace({ workspace, retry = 1 }: TProps) {
  logger.debug({ msg: 'Spawn workspace', workspaceId: workspace.id, retry });

  const { data: credentials, error } = await driveServerWipModule.workspaces.getCredentials({ workspaceId: workspace.id });

  if (error) {
    setTimeout(async () => {
      await spawnWorkspace({ workspace, retry: retry + 1 });
    }, 5000);
    return;
  }

  const user = getUserOrThrow();

  const mnemonic = await decryptMessageWithPrivateKey({
    encryptedMessage: Buffer.from(workspace.mnemonic, 'base64').toString(),
    privateKeyInBase64: user.privateKey,
  });

  const config: Config = {
    mnemonic: mnemonic.toString(),
    providerId: `{${workspace.id}}`,
    rootPath: getRootWorkspace(workspace.id),
    providerName: 'Internxt Drive for Business',
    loggerPath: getLoggersPaths().logWatcherPath,
    workspaceId: workspace.id,
    workspaceToken: credentials.tokenHeader,
    rootUuid: workspace.rootFolderId,
    bucket: credentials.bucket,
    bridgeUser: credentials.credentials.networkUser,
    bridgePass: credentials.credentials.networkPass,
  };

  await spawnSyncEngineWorker({ config });
}
