import { PendingPaths } from './get-pending-items';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '../config';
import { AddController } from '../callbacks-controllers/controllers/add-controller';

type TProps = {
  ctx: ProcessSyncContext;
  pendingFiles: PendingPaths[];
};

export async function addPendingFiles({ ctx, pendingFiles }: TProps) {
  await Promise.all(
    pendingFiles.map(async ({ absolutePath, stats }) => {
      const path = pathUtils.absoluteToRelative({
        base: ctx.virtualDrive.syncRootPath,
        path: absolutePath,
      });

      await AddController.createFile({ ctx, absolutePath, path, stats });
    }),
  );
}
