import { Service } from 'diod';
import { getUser } from '../../auth/service';
import { Config } from '@/apps/sync-engine/config';
import { getLoggersPaths, getRootVirtualDrive, getRootWorkspace } from '../../virtual-root-folder/service';
import { SpawnSyncEngineWorkerService } from './spawn-sync-engine-worker.service';
import { syncWorkspaceService } from '../../remote-sync/handlers';
import { FetchWorkspacesService } from '../../remote-sync/workspace/fetch-workspaces.service';
import { decryptMessageWithPrivateKey } from '@/apps/shared/crypto/service';

@Service()
export class SpawnAllSyncEngineWorkersService {
  constructor(private readonly spawnSyncEngineWorker: SpawnSyncEngineWorkerService) {}

  async run() {
    const user = getUser();

    if (!user) {
      return;
    }

    const config: Config = {
      providerId: `{${process.env.PROVIDER_ID}}`,
      rootPath: getRootVirtualDrive(),
      providerName: 'Internxt Drive',
      workspaceId: '',
      loggerPath: getLoggersPaths().logEnginePath,
      rootUuid: user.rootFolderId,
      mnemonic: user.mnemonic,
      bucket: user.bucket,
      bridgeUser: user.bridgeUser,
      bridgePass: user.userId,
      workspaceToken: undefined,
    };

    await this.spawnSyncEngineWorker.run({ config });

    const workspaces = await syncWorkspaceService.getWorkspaces();

    await Promise.all(
      workspaces.map(async (workspace) => {
        const workspaceCredential = await FetchWorkspacesService.getCredencials(workspace.id);

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
          workspaceToken: workspaceCredential.tokenHeader,
          rootUuid: await syncWorkspaceService.getRootFolderUuid(workspace.id),
          bucket: workspaceCredential.bucket,
          bridgeUser: workspaceCredential.credentials.networkUser,
          bridgePass: workspaceCredential.credentials.networkPass,
        };

        await this.spawnSyncEngineWorker.run({ config });
      }),
    );
  }
}
