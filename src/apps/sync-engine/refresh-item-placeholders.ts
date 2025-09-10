import { deleteItemPlaceholders } from '@/backend/features/remote-sync/file-explorer/delete-item-placeholders';
import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { ProcessSyncContext } from './config';
import { FolderPlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';
import { Traverser } from '@/context/virtual-drive/items/application/Traverser';
import { FilePlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';

type Props = {
  ctx: ProcessSyncContext;
};

export async function refreshItemPlaceholders({ ctx }: Props) {
  try {
    const tree = await Traverser.run({ ctx });

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Tree built',
      workspaceId: ctx.workspaceId,
      files: tree.files.length,
      folders: tree.folders.length,
      trashedFiles: tree.trashedFiles.length,
      trashedFolders: tree.trashedFolders.length,
    });

    const { files, folders } = await loadInMemoryPaths({ ctx });
    await Promise.all([
      deleteItemPlaceholders({ ctx, remotes: tree.trashedFolders, type: 'folder' }),
      deleteItemPlaceholders({ ctx, remotes: tree.trashedFiles, type: 'file' }),
      FolderPlaceholderUpdater.run({ ctx, remotes: tree.folders, folders }),
      FilePlaceholderUpdater.run({ ctx, remotes: tree.files, files }),
    ]);
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error refreshing item placeholders',
      workspaceId: ctx.workspaceId,
      exc,
    });
  }
}
