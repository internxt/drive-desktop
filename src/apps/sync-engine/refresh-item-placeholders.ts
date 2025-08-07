import { deleteItemPlaceholders } from '@/backend/features/remote-sync/file-explorer/delete-item-placeholders';
import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { DependencyContainer } from './dependency-injection/DependencyContainer';

type Props = {
  container: DependencyContainer;
};

export async function refreshItemPlaceholders({ container }: Props) {
  const startTime = performance.now();

  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Refreshing item placeholders' });

  try {
    const tree = await container.traverser.run();

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Tree built',
      files: tree.files.length,
      folders: tree.folders.length,
      trashedFiles: tree.trashedFiles.length,
      trashedFolders: tree.trashedFolders.length,
    });

    deleteItemPlaceholders({ remotes: tree.trashedFolders, type: 'folder' });
    deleteItemPlaceholders({ remotes: tree.trashedFiles, type: 'file' });

    const { files, folders } = await loadInMemoryPaths();
    await Promise.all([
      container.folderPlaceholderUpdater.run({ remotes: tree.folders, folders }),
      container.filePlaceholderUpdater.run({ remotes: tree.files, files }),
    ]);
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error refreshing item placeholders',
      exc,
    });
  }

  const endTime = performance.now();

  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Finish refreshing item placeholders',
    time: `${(endTime - startTime) / 1000}s`,
  });
}
