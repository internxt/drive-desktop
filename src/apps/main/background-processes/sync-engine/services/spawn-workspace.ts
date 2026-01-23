import { AuthContext, SyncContext } from '@/apps/sync-engine/config';
import { decryptMessageWithPrivateKey } from '@/apps/shared/crypto/service';
import { spawnSyncEngineWorker } from './spawn-sync-engine-worker';
import { createLogger, logger } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { getUserOrThrow } from '@/apps/main/auth/service';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { buildEnvironment } from '../../backups/build-environment';

type TProps = {
  ctx: AuthContext;
  workspace: {
    id: string;
    key: string;
    providerId: string;
    rootFolderId: string;
    rootPath: AbsolutePath;
  };
};

export async function spawnWorkspace({ ctx, workspace }: TProps) {
  const { data: credentials, error } = await driveServerWipModule.workspaces.getCredentials({
    ctx,
    context: { workspaceId: workspace.id },
  });

  if (error) return;

  const user = getUserOrThrow();

  try {
    const mnemonic = await decryptMessageWithPrivateKey({
      encryptedMessage: Buffer.from(workspace.key, 'base64').toString(),
      privateKeyInBase64: user.privateKey,
    });

    const { environment, contentsDownloader } = buildEnvironment({
      bucket: credentials.bucket,
      mnemonic,
      bridgeUser: credentials.credentials.networkUser,
      bridgePass: credentials.credentials.networkPass,
    });

    const syncCtx: SyncContext = {
      abortController: ctx.abortController,
      wipBottleneck: ctx.wipBottleneck,
      uploadBottleneck: ctx.uploadBottleneck,
      client: ctx.client,
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
      environment,
      contentsDownloader,
    };

    await spawnSyncEngineWorker({ ctx: syncCtx });
  } catch (exc) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error spawning workspace', exc });
  }
}
