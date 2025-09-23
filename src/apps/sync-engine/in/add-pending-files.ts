import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '../config';
import { AddController } from '../callbacks-controllers/controllers/add-controller';
import { FileExplorerItem } from '../file-explorer-state/get-file-explorer-state';

type TProps = {
  ctx: ProcessSyncContext;
  createFiles: FileExplorerItem[];
};

export async function addPendingFiles({ ctx, createFiles }: TProps) {
  await Promise.all(
    createFiles.map(async ({ absolutePath, stats }) => {
      const path = pathUtils.absoluteToRelative({
        base: ctx.virtualDrive.syncRootPath,
        path: absolutePath,
      });

      await AddController.createFile({ ctx, absolutePath, path, stats });
    }),
  );
}
