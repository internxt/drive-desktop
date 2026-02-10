import { Addon } from '@/node-win/addon-wrapper';
import { addSyncIssue } from '../../issues';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { SyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';

type Props = {
  ctx: SyncContext;
};

export async function loadVirtualDrive({ ctx }: Props) {
  try {
    await VirtualDrive.createSyncRootFolder({ rootPath: ctx.rootPath });

    const error = await NodeWin.registerSyncRoot({ ctx });
    const info = await getSyncRootFromPath(ctx);

    if (error) {
      if (error.code !== 'ACCESS_DENIED') throw error;
      if (!info) throw error;

      await Addon.unregisterSyncRoot({ providerId: info.id });
      await Addon.registerSyncRoot({ rootPath: ctx.rootPath, providerId: ctx.providerId, providerName: ctx.providerName });
    }

    const connectionKey = Addon.connectSyncRoot({ ctx });
    ctx.logger.debug({ msg: 'Connection key', connectionKey });
    return connectionKey;
  } catch (error) {
    addSyncIssue({ error: 'CANNOT_REGISTER_VIRTUAL_DRIVE', name: ctx.rootPath });
    ctx.logger.error({ msg: 'Error loading virtual drive', error });
    return;
  }
}

async function getSyncRootFromPath(ctx: SyncContext) {
  try {
    const info = await Addon.getSyncRootFromPath({ path: ctx.rootPath });
    ctx.logger.debug({ msg: 'Sync root from path', info });
    return info;
  } catch (error) {
    ctx.logger.error({ msg: 'Error getting sync root from path', error });
    return;
  }
}
