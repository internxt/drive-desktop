import { logger } from '@internxt/drive-desktop-core/build/backend';
import { addPendingFiles } from './add-pending-files';
import { addPendingFolders } from './add-pending-folders';
import { ProcessSyncContext } from '../config';
import { getFileExplorerState } from '../file-explorer-state/get-file-explorer-state';
import { updateContentsId } from '../callbacks-controllers/controllers/update-contents-id';

type Props = {
  ctx: ProcessSyncContext;
};

export async function addPendingItems({ ctx }: Props) {
  try {
    const startTime = performance.now();

    const { createFiles, createFolders, modifiedFiles } = await getFileExplorerState({ ctx });

    await Promise.all([
      addPendingFiles({ ctx, createFiles }),
      addPendingFolders({ ctx, createFolders }),
      modifiedFiles.map((file) => updateContentsId({ ctx, ...file })),
    ]);

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
