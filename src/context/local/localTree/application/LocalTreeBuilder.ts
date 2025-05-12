import { LocalFile } from '../../localFile/domain/LocalFile';
import { AbsolutePath, createRelativePath } from '../../localFile/infrastructure/AbsolutePath';
import { LocalTree } from '../domain/LocalTree';
import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { Either, left, right } from '../../../shared/domain/Either';
import Logger from 'electron-log';
import { CLSFsLocalItemsGenerator } from '../infrastructure/FsLocalItemsGenerator';
import { relative } from 'path';

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

        tree.addFile(currentFolder, file);
      });

      for (const folderAttributes of folders) {
        const relativePath = createRelativePath(relative(tree.root.path, folderAttributes.path));

        const folder = LocalFolder.from({
          ...folderAttributes,
          relativePath,
        });

        tree.addFolder(currentFolder, folder);

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

    const tree = new LocalTree(rootFolder);

    await this.traverse(tree, rootFolder);

    return right(tree);
  }
}
