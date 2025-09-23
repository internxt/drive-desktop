import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '../config';
import { AddController } from '../callbacks-controllers/controllers/add-controller';
import { PendingFileExplorerItem } from '../file-explorer-state/file-explorer-state.types';

type TProps = {
  ctx: ProcessSyncContext;
  createFiles: PendingFileExplorerItem[];
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
