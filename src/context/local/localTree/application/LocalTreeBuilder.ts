import { Service } from 'diod';
import { LocalFile } from '../../localFile/domain/LocalFile';
import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import { LocalItemsGenerator } from '../domain/LocalItemsGenerator';
import { LocalTree } from '../domain/LocalTree';
import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { Either, left, right } from '../../../shared/domain/Either';
import Logger from 'electron-log';

@Service()
export default class LocalTreeBuilder {
  constructor(private readonly generator: LocalItemsGenerator) {}

  private async traverse(
    tree: LocalTree,
    currentFolder: LocalFolder
  ): Promise<LocalTree> {
    const { files, folders } = await this.generator.getAll(currentFolder.path);

    files.forEach((fileAttributes) => {
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
  }

  async run(
    folder: AbsolutePath
  ): Promise<Either<DriveDesktopError, LocalTree>> {
    const rootEither = await this.generator.root(folder);

    Logger.debug('[LOCAL TREE BUILDER] Root either', rootEither);

    if (rootEither.isLeft()) {
      return left(rootEither.getLeft());
    }

    Logger.debug('[LOCAL TREE BUILDER] Root either 2');

    const root = rootEither.getRight();

    Logger.debug('[LOCAL TREE BUILDER] Root', root);

    const rootFolder = LocalFolder.from(root);

    Logger.debug('[LOCAL TREE BUILDER] Root folder', rootFolder);

    const tree = new LocalTree(rootFolder);

    Logger.debug('[LOCAL TREE BUILDER] Tree', tree);

    await this.traverse(tree, rootFolder);

    Logger.debug('[LOCAL TREE BUILDER] Tree 2');

    return right(tree);
  }
}
