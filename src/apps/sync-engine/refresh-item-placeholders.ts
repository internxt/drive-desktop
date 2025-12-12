import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { ProcessSyncContext } from './config';
import { Traverser } from '@/context/virtual-drive/items/application/Traverser';
import { getAllItems } from '@/context/virtual-drive/items/application/RemoteItemsGenerator';

type Props = {
  ctx: ProcessSyncContext;
  runDangledFiles: boolean;
};

export async function refreshItemPlaceholders({ ctx, runDangledFiles }: Props) {
  try {
    const { files, folders } = await loadInMemoryPaths({ ctx });
    const items = await getAllItems({ ctx });
    const currentFolder = { absolutePath: ctx.rootPath, uuid: ctx.rootUuid };
    await Traverser.run({ ctx, currentFolder, items, files, folders, runDangledFiles });
  } catch (error) {
    ctx.logger.error({
      msg: 'Error refreshing item placeholders',
      error,
    });
  }
}
