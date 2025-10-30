import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '../config';
import { createFolder } from '@/features/sync/add-item/create-folder';
import { PendingFileExplorerItem } from '../file-explorer-state/file-explorer-state.types';

type TProps = {
  ctx: ProcessSyncContext;
  createFolders: PendingFileExplorerItem[];
};

export async function addPendingFolders({ ctx, createFolders }: TProps) {
  await Promise.all(
    createFolders.map(async ({ absolutePath }) => {
      const path = pathUtils.absoluteToRelative({
        base: ctx.virtualDrive.syncRootPath,
        path: absolutePath,
      });

      await createFolder({ ctx, path });
    }),
  );
}
