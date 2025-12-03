import { deleteItemPlaceholders } from '@/backend/features/remote-sync/file-explorer/delete-item-placeholders';
import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { SyncContext } from './config';
import { FolderPlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';
import { Traverser } from '@/context/virtual-drive/items/application/Traverser';
import { FilePlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';

type Props = {
  ctx: SyncContext;
};

export async function refreshItemPlaceholders({ ctx }: Props) {
  try {
    const tree = await Traverser.run({ ctx });

    ctx.logger.debug({
      msg: 'Tree built',
      files: tree.files.length,
      folders: tree.folders.length,
      trashedFiles: tree.trashedFiles.length,
      trashedFolders: tree.trashedFolders.length,
    });

    const { files, folders } = await loadInMemoryPaths({ ctx });
    await Promise.all([
      deleteItemPlaceholders({ ctx, type: 'folder', remotes: tree.trashedFolders, locals: folders }),
      deleteItemPlaceholders({ ctx, type: 'file', remotes: tree.trashedFiles, locals: files }),
      FolderPlaceholderUpdater.run({ ctx, remotes: tree.folders, folders }),
      FilePlaceholderUpdater.run({ ctx, remotes: tree.files, files }),
    ]);
  } catch (exc) {
    ctx.logger.error({
      msg: 'Error refreshing item placeholders',
      exc,
    });
  }
}
