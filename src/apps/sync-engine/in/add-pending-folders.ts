import { ProcessSyncContext } from '../config';
import { PendingFileExplorerItem } from '../file-explorer-state/file-explorer-state.types';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';

type TProps = {
  ctx: ProcessSyncContext;
  createFolders: PendingFileExplorerItem[];
};

export async function addPendingFolders({ ctx, createFolders }: TProps) {
  await Promise.all(
    createFolders.map(async ({ path }) => {
      try {
        await FolderCreator.run({ ctx, path });
      } catch (error) {
        ctx.logger.error({
          msg: 'Error adding pending folder',
          path,
          error,
        });
      }
    }),
  );
}
