import { PendingPaths } from './get-pending-items';
import { IControllers } from '../callbacks-controllers/buildControllers';
import { virtualDrive } from '../dependency-injection/common/virtualDrive';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '../config';

type TProps = {
  ctx: ProcessSyncContext;
  controllers: IControllers;
  pendingFolders: PendingPaths[];
};

export async function addPendingFolders({ ctx, controllers, pendingFolders }: TProps) {
  await Promise.all(
    pendingFolders.map(async ({ absolutePath }) => {
      const path = pathUtils.absoluteToRelative({
        base: virtualDrive.syncRootPath,
        path: absolutePath,
      });

      await controllers.addFile.createFolder({ ctx, path, absolutePath });
    }),
  );
}
