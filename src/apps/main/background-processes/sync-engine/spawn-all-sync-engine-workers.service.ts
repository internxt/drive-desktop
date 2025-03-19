import { Service } from 'diod';
import { getUser } from '../../auth/service';
import { Config } from '@/apps/sync-engine/config';
import { getLoggersPaths, getRootVirtualDrive, getRootWorkspace } from '../../virtual-root-folder/service';
import { SpawnSyncEngineWorkerService } from './spawn-sync-engine-worker.service';
import { decryptMessageWithPrivateKey } from '@/apps/shared/crypto/service';
import { SyncRemoteWorkspaceService } from '../../remote-sync/workspace/sync-remote-workspace';
import { FetchWorkspacesService } from '../../remote-sync/workspace/fetch-workspaces.service';

@Service()
export class SpawnAllSyncEngineWorkersService {
  constructor(
    private readonly spawnSyncEngineWorker: SpawnSyncEngineWorkerService,
    private readonly syncRemoteWorkspace: SyncRemoteWorkspaceService,
  ) {}

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

    const workspaces = await this.syncRemoteWorkspace.getWorkspaces();

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
          rootUuid: await this.syncRemoteWorkspace.getRootFolderUuid(workspace.id),
          bucket: workspaceCredential.bucket,
          bridgeUser: workspaceCredential.credentials.networkUser,
          bridgePass: workspaceCredential.credentials.networkPass,
        };

        await this.spawnSyncEngineWorker.run({ config });
      }),
    );
  }
}
