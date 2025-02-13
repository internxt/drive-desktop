import { Service } from 'diod';
import { LocalFile } from '../../localFile/domain/LocalFile';
import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import { LocalTree } from '../domain/LocalTree';
import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { Either, left, right } from '../../../shared/domain/Either';
import Logger from 'electron-log';
import { CLSFsLocalItemsGenerator } from '../infrastructure/FsLocalItemsGenerator';

@Service()
export default class LocalTreeBuilder {
  constructor(private readonly generator: CLSFsLocalItemsGenerator) {}

  private async traverse(tree: LocalTree, currentFolder: LocalFolder): Promise<LocalTree> {
    try {
      const { files, folders } = await this.generator.getAll(currentFolder.path);

      files.forEach((fileAttributes) => {
        if (fileAttributes.size === 0) {
          return;
        }
        const file = LocalFile.from(fileAttributes);
        tree.addFile(currentFolder, file);
      });

      for (const folderAttributes of folders) {
        const folder = LocalFolder.from(folderAttributes);

        tree.addFolder(currentFolder, folder);

        // eslint-disable-next-line no-await-in-loop
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

  async run(folder: AbsolutePath): Promise<Either<DriveDesktopError, LocalTree>> {
    const rootEither = await this.generator.root(folder);

    if (rootEither.isLeft()) {
      return left(rootEither.getLeft());
    }

    const root = rootEither.getRight();

    const rootFolder = LocalFolder.from(root);

    const tree = new LocalTree(rootFolder);

    await this.traverse(tree, rootFolder);

    return right(tree);
  }
}
