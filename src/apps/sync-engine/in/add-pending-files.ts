import { PendingPaths } from './get-pending-items';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { virtualDrive } from '../dependency-injection/common/virtualDrive';
import { IControllers } from '../callbacks-controllers/buildControllers';

type TProps = {
  controllers: IControllers;
  pendingFiles: PendingPaths[];
};

export async function addPendingFiles({ controllers, pendingFiles }: TProps) {
  await Promise.all(
    pendingFiles.map(async ({ absolutePath, stats }) => {
      const path = pathUtils.absoluteToRelative({
        base: virtualDrive.syncRootPath,
        path: absolutePath,
      });

      await controllers.addFile.createFile({ absolutePath, path, stats });
    }),
  );
}
