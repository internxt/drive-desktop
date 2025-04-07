import { Config } from '@/apps/sync-engine/config';
import { getLoggersPaths } from '@/apps/main/virtual-root-folder/service';
import { decryptMessageWithPrivateKey } from '@/apps/shared/crypto/service';
import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { sleep } from '@/apps/main/util';

type TProps = {
  retry?: number;
  workspace: {
    id: string;
    mnemonic: string;
    providerId: string;
    rootFolderId: string;
    rootPath: string;
  };
};

export async function spawnWorkspace({ workspace, retry = 1 }: TProps) {
  logger.debug({ msg: 'Spawn workspace', workspaceId: workspace.id, retry });

  const { data: credentials, error } = await driveServerWipModule.workspaces.getCredentials({ workspaceId: workspace.id });

  if (error) {
    await sleep(5000);
    await spawnWorkspace({ workspace, retry: retry + 1 });
    return;
  }

  const user = getUserOrThrow();

  const mnemonic = await decryptMessageWithPrivateKey({
    encryptedMessage: Buffer.from(workspace.mnemonic, 'base64').toString(),
    privateKeyInBase64: user.privateKey,
  });

  const config: Config = {
    mnemonic: mnemonic.toString(),
    providerId: workspace.providerId,
    rootPath: workspace.rootPath,
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
