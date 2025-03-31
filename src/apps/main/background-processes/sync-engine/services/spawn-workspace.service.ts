import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { Config } from '@/apps/sync-engine/config';
import { getLoggersPaths, getRootWorkspace } from '@/apps/main/virtual-root-folder/service';
import { SpawnSyncEngineWorkerService } from './spawn-sync-engine-worker.service';
import { loggerService } from '@/apps/shared/logger/logger';
import { GetUserService } from '@/apps/main/auth/get-user.service';
import { CryptoService } from '@/apps/shared/crypto/crypto.service';

type TProps = {
  retry?: number;
  workspace: {
    id: string;
    mnemonic: string;
    rootFolderId: string;
  };
};

export class SpawnWorkspaceService {
  constructor(
    private readonly driveServerWip = driveServerWipModule,
    private readonly spawnSyncEngineWorker = new SpawnSyncEngineWorkerService(),
    private readonly logger = loggerService,
    private readonly getUser = new GetUserService(),
    private readonly crypto = new CryptoService(),
  ) {}

  async run({ workspace, retry = 1 }: TProps) {
    this.logger.debug({ msg: 'Spawn workspace', workspaceId: workspace.id, retry });

    const { data: credentials, error } = await this.driveServerWip.workspaces.getCredentials({ workspaceId: workspace.id });

    if (error) {
      setTimeout(async () => {
        await this.run({ workspace, retry: retry + 1 });
      }, 5000);
      return;
    }

    const user = this.getUser.getOrThrow();

    const mnemonic = await this.crypto.decryptMessageWithPrivateKey({
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

    await this.spawnSyncEngineWorker.run({ config });
  }
}
