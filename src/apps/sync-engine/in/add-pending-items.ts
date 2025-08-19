import { logger } from '@internxt/drive-desktop-core/build/backend';
import { virtualDrive } from '../dependency-injection/common/virtualDrive';
import { getPendingItems } from './get-pending-items';
import { addPendingFiles } from './add-pending-files';
import { addPendingFolders } from './add-pending-folders';
import { IControllers } from '../callbacks-controllers/buildControllers';
import { SyncContext } from '../config';

type Props = {
  ctx: SyncContext;
  controllers: IControllers;
};

export async function addPendingItems({ ctx, controllers }: Props) {
  const firstTimeRegistered = !ctx.previousProviderIds.includes(ctx.providerId);

  /**
   * v2.5.7 Daniel Jiménez
   * If the cloud provider was not registered before it means that all items that
   * were in the root folder have their placeholders gone, so it's going to consider
   * that all items are new and try to create them again.
   */
  if (firstTimeRegistered) return;

  try {
    const { pendingFiles, pendingFolders } = await getPendingItems({
      virtualDrive,
      path: virtualDrive.syncRootPath,
    });

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Pending items',
      workspaceId: ctx.workspaceId,
      pendingFiles: pendingFiles.length,
      pendingFolders: pendingFolders.length,
    });

    await Promise.all([addPendingFiles({ pendingFiles, controllers }), addPendingFolders({ pendingFolders, controllers })]);
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error adding pending items',
      exc,
    });
  }
}
