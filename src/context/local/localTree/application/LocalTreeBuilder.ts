import { LocalFile } from '../../localFile/domain/LocalFile';
import { AbsolutePath, createRelativePath, RelativePath } from '../../localFile/infrastructure/AbsolutePath';
import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { Either, left, right } from '../../../shared/domain/Either';
import Logger from 'electron-log';
import { CLSFsLocalItemsGenerator } from '../infrastructure/FsLocalItemsGenerator';
import { relative } from 'path';
import { LocalFileSize } from '../../localFile/domain/LocalFileSize';

export type LocalTree = {
  root: LocalFolder;
  files: Record<RelativePath, LocalFile>;
  folders: Record<RelativePath, LocalFolder>;
};

export default class LocalTreeBuilder {
  private static async traverse(tree: LocalTree, currentFolder: LocalFolder): Promise<LocalTree> {
    try {
      const { files, folders } = await CLSFsLocalItemsGenerator.getAll(currentFolder.absolutePath);

      files.forEach((fileAttributes) => {
        if (fileAttributes.size === 0) {
          return;
        }

        const relativePath = createRelativePath(relative(tree.root.absolutePath, fileAttributes.path));

        tree.files[relativePath] = {
          absolutePath: fileAttributes.path,
          relativePath,
          size: new LocalFileSize(fileAttributes.size),
          modificationTime: fileAttributes.modificationTime,
        };
      });

      for (const folderAttributes of folders) {
        const relativePath = createRelativePath(relative(tree.root.absolutePath, folderAttributes.path));

        const folder: LocalFolder = {
          absolutePath: folderAttributes.path,
          relativePath,
        };

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

    const rootFolder: LocalFolder = {
      absolutePath: root.path,
      relativePath: createRelativePath('/'),
    };

    const tree: LocalTree = {
      root: rootFolder,
      files: {},
      folders: {
        [rootFolder.relativePath]: rootFolder,
      },
    };

    await this.traverse(tree, rootFolder);

    return right(tree);
  }
}
