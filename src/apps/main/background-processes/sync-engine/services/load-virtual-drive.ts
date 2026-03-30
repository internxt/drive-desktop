import { SyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Addon } from '@/node-win/addon-wrapper';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { addSyncIssue, removeSyncIssue } from '../../issues';

type Props = {
  ctx: SyncContext;
};

export async function loadVirtualDrive({ ctx }: Props) {
  const { rootPath } = ctx;

  try {
    await VirtualDrive.createSyncRootFolder({ rootPath });

    const error = await NodeWin.registerSyncRoot({ ctx });
    const info = await getSyncRootFromPath(ctx);

    if (error) {
      const providerId = info ? info.id : ctx.providerId;
      await Addon.unregisterSyncRoot({ providerId });
      await Addon.registerSyncRoot({ rootPath, providerId: ctx.providerId, providerName: ctx.providerName });
    }

    const connectionKey = Addon.connectSyncRoot({ rootPath });
    ctx.logger.debug({ msg: 'Connection key', connectionKey });
    removeSyncIssue({ error: 'CANNOT_REGISTER_VIRTUAL_DRIVE', name: rootPath });
    return connectionKey;
  } catch (error) {
    addSyncIssue({ error: 'CANNOT_REGISTER_VIRTUAL_DRIVE', name: rootPath });
    ctx.logger.error({ msg: 'Error loading virtual drive', error });
    return;
  }
}

async function getSyncRootFromPath(ctx: SyncContext) {
  try {
    const info = await Addon.getSyncRootFromPath({ rootPath: ctx.rootPath });
    ctx.logger.debug({ msg: 'Sync root from path', info });
    return info;
  } catch (error) {
    ctx.logger.error({ msg: 'Error getting sync root from path', error });
    return;
  }
}
