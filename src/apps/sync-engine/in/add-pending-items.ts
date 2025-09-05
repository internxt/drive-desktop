import { logger } from '@internxt/drive-desktop-core/build/backend';
import { getPendingItems } from './get-pending-items';
import { addPendingFiles } from './add-pending-files';
import { addPendingFolders } from './add-pending-folders';
import { syncModifiedFiles } from './sync-modified-files';
import { ProcessSyncContext } from '../config';

type Props = {
  ctx: ProcessSyncContext;
};

export async function addPendingItems({ ctx }: Props) {
  try {
    const { pendingFiles, pendingFolders } = await getPendingItems({
      ctx,
      path: ctx.virtualDrive.syncRootPath,
    });

    const startTime = performance.now();

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Pending items',
      workspaceId: ctx.workspaceId,
      pendingFiles: pendingFiles.length,
      pendingFolders: pendingFolders.length,
    });

    await Promise.all([addPendingFiles({ ctx, pendingFiles }), addPendingFolders({ ctx, pendingFolders })]);
    await syncModifiedFiles({ ctx });

    const endTime = performance.now();

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: '[TIME] Finish pending items',
      workspaceId: ctx.workspaceId,
      time: `${(endTime - startTime) / 1000}s`,
    });
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error adding pending items',
      exc,
    });
  }
}
