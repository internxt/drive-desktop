import { PendingPaths } from './get-pending-items';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '../config';
import { createFolder } from '@/features/sync/add-item/create-folder';

type TProps = {
  ctx: ProcessSyncContext;
  pendingFolders: PendingPaths[];
};

export async function addPendingFolders({ ctx, pendingFolders }: TProps) {
  await Promise.all(
    pendingFolders.map(async ({ absolutePath }) => {
      const path = pathUtils.absoluteToRelative({
        base: ctx.virtualDrive.syncRootPath,
        path: absolutePath,
      });

      await createFolder({ ctx, path, absolutePath });
    }),
  );
}
