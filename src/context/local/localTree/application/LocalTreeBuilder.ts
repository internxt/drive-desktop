import { LocalFile } from '../../localFile/domain/LocalFile';
import { AbsolutePath, createRelativePath, RelativePath } from '../../localFile/infrastructure/AbsolutePath';
import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { Either, left, right } from '../../../shared/domain/Either';
import Logger from 'electron-log';
import { CLSFsLocalItemsGenerator } from '../infrastructure/FsLocalItemsGenerator';
import { relative } from 'path';

export type LocalTree = {
  root: LocalFolder;
  files: Record<RelativePath, LocalFile>;
  folders: Record<RelativePath, LocalFolder>;
};

export default class LocalTreeBuilder {
  private static async traverse(tree: LocalTree, currentFolder: LocalFolder): Promise<LocalTree> {
    try {
      const { files, folders } = await CLSFsLocalItemsGenerator.getAll(currentFolder.path);

      files.forEach((fileAttributes) => {
        if (fileAttributes.size === 0) {
          return;
        }

        const relativePath = createRelativePath(relative(tree.root.path, fileAttributes.path));

        const file = LocalFile.from({
          ...fileAttributes,
          relativePath,
        });

        tree.files[relativePath] = file;
      });

      for (const folderAttributes of folders) {
        const relativePath = createRelativePath(relative(tree.root.path, folderAttributes.path));

        const folder = LocalFolder.from({
          ...folderAttributes,
          relativePath,
        });

        tree.folders[relativePath] = folder;

        await this.traverse(tree, folder);
      }

      return tree;
    } catch (error) {
      if (error instanceof DriveDesktopError) {
        throw error;
      }
      Logger.error('Error while adding file to tree', error);
      throw new DriveDesktopError('UNKNOWN');
    }
  }

  static async run(folder: AbsolutePath): Promise<Either<DriveDesktopError, LocalTree>> {
    const rootEither = await CLSFsLocalItemsGenerator.root(folder);

    if (rootEither.isLeft()) {
      return left(rootEither.getLeft());
    }

    const root = rootEither.getRight();

    const rootFolder = LocalFolder.from({
      ...root,
      relativePath: createRelativePath('/'),
    });

    const tree: LocalTree = {
      root: rootFolder,
      files: {},
      folders: {
        [rootFolder.relativePath]: rootFolder,
      },
    };

    await this.traverse(tree, rootFolder);

    tree.files = Object.fromEntries(Object.entries(tree.files).sort((a, b) => a[0].localeCompare(b[0])));
    tree.folders = Object.fromEntries(Object.entries(tree.folders).sort((a, b) => a[0].localeCompare(b[0])));

    return right(tree);
  }
}
