import { logger } from '@internxt/drive-desktop-core/build/backend';
import { virtualDrive } from '../dependency-injection/common/virtualDrive';
import { getPendingItems } from './get-pending-items';
import { addPendingFiles } from './add-pending-files';
import { addPendingFolders } from './add-pending-folders';
import { IControllers } from '../callbacks-controllers/buildControllers';
import { syncModifiedFiles } from './sync-modified-files';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { ProcessSyncContext } from '../config';

type Props = {
  ctx: ProcessSyncContext;
  controllers: IControllers;
  fileContentsUploader: ContentsUploader;
};

export async function addPendingItems({ ctx, controllers, fileContentsUploader }: Props) {
  try {
    const { pendingFiles, pendingFolders } = await getPendingItems({
      virtualDrive,
      path: virtualDrive.syncRootPath,
    });

    const startTime = performance.now();

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Pending items',
      workspaceId: ctx.workspaceId,
      pendingFiles: pendingFiles.length,
      pendingFolders: pendingFolders.length,
    });

    await Promise.all([addPendingFiles({ ctx, pendingFiles, controllers }), addPendingFolders({ ctx, pendingFolders })]);
    await syncModifiedFiles({ fileContentsUploader, virtualDrive });

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
