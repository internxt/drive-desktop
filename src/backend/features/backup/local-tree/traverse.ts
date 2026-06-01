import { logger } from '@internxt/drive-desktop-core/build/backend';
import { AbsolutePath } from '../../../../context/local/localFile/infrastructure/AbsolutePath';
import { LocalTree } from '../../../../context/local/localTree/domain/LocalTree';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { Result } from '../../../../context/shared/domain/Result';

import { ExtendedDirent, ProcessedDirents } from './types';
import { LocalFile } from '../../../../context/local/localFile/domain/LocalFile';
import { LocalFolder } from '../../../../context/local/localFolder/domain/LocalFolder';
import { getDirentsForPath } from './get-dirents-for-path';

type TraverseResult = Pick<ProcessedDirents, 'skippedItems'>;

type Props = {
  tree: LocalTree;
  currentFolder: AbsolutePath;
  rootFolder: AbsolutePath;
};

export async function traverse({
  tree,
  currentFolder,
  rootFolder,
}: Props): Promise<Result<TraverseResult, DriveDesktopError>> {
  const { data, error } = await getDirentsForPath(currentFolder);
  if (error) {
    return handleReadError({ currentFolder, rootFolder, error });
  }

  if (data.skippedItems.length > 0) {
    logger.warn({
      tag: 'BACKUPS',
      msg: 'Skipped Local backup items',
      pathname: currentFolder,
      skippedItems: data.skippedItems.map((item) => ({ path: item.path, error: item.error.message })),
    });
  }

  const skippedItems = [...data.skippedItems];

  const { data: currentLocalFolder, error: currentLocalFolderError } = getCurrentLocalFolder({ tree, currentFolder });
  if (currentLocalFolderError) {
    return { error: currentLocalFolderError };
  }

  addFilesToTree({ tree, currentLocalFolder, files: data.files });

  const { data: childFolderResult, error: childFolderError } = await addFoldersToTreeAndTraverseChildren({
    tree,
    currentLocalFolder,
    folders: data.folders,
    rootFolder,
  });
  if (childFolderError) {
    return { error: childFolderError };
  }
  skippedItems.push(...childFolderResult.skippedItems);

  return { data: { skippedItems } };
}

function handleReadError({
  currentFolder,
  rootFolder,
  error,
}: {
  currentFolder: AbsolutePath;
  rootFolder: AbsolutePath;
  error: DriveDesktopError;
}): Result<TraverseResult, DriveDesktopError> {
  if (currentFolder === rootFolder) {
    return { error };
  }

  logger.warn({
    tag: 'BACKUPS',
    msg: 'Skipped unreadable local backup folder',
    pathname: currentFolder,
    error: error.message,
  });

  return { data: { skippedItems: [{ path: currentFolder, error }] } };
}

function getCurrentLocalFolder({
  tree,
  currentFolder,
}: {
  tree: LocalTree;
  currentFolder: AbsolutePath;
}): Result<LocalFolder, DriveDesktopError> {
  const folder = tree.folders.find((folder) => folder.path === currentFolder);

  if (!folder) {
    const error = new DriveDesktopError('UNKNOWN', `Current folder ${currentFolder} not found in the tree`);
    logger.error({ tag: 'BACKUPS', msg: 'Error traversing local tree', pathname: currentFolder, error });
    return { error };
  }

  return { data: folder };
}

function addFilesToTree({
  tree,
  currentLocalFolder,
  files,
}: {
  tree: LocalTree;
  currentLocalFolder: LocalFolder;
  files: ExtendedDirent[];
}): void {
  files.forEach(({ path, stats }) => {
    const file = LocalFile.from({ path, modificationTime: stats.mtime.getTime(), size: stats.size });
    tree.addFile(currentLocalFolder, file);
  });
}

async function addFoldersToTreeAndTraverseChildren({
  tree,
  currentLocalFolder,
  folders,
  rootFolder,
}: {
  tree: LocalTree;
  currentLocalFolder: LocalFolder;
  folders: ExtendedDirent[];
  rootFolder: AbsolutePath;
}): Promise<Result<TraverseResult, DriveDesktopError>> {
  const skippedItems: TraverseResult['skippedItems'] = [];

  for (const { path, stats } of folders) {
    const folder = LocalFolder.from(path, stats.mtime.getTime());
    tree.addFolder(currentLocalFolder, folder);

    // eslint-disable-next-line no-await-in-loop
    const result = await traverse({ tree, currentFolder: path, rootFolder });
    if (result.error) {
      return { error: result.error };
    }

    skippedItems.push(...result.data.skippedItems);
  }

  return { data: { skippedItems } };
}
