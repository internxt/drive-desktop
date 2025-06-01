import { LocalFile } from '../../localFile/domain/LocalFile';
import { createRelativePath, RelativePath } from '../../localFile/infrastructure/AbsolutePath';
import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { CLSFsLocalItemsGenerator } from '../infrastructure/FsLocalItemsGenerator';
import { relative } from 'path';
import { LocalFileSize } from '../../localFile/domain/LocalFileSize';
import { BackupsContext } from '@/apps/backups/BackupInfo';

export type LocalTree = {
  root: LocalFolder;
  files: Record<RelativePath, LocalFile>;
  folders: Record<RelativePath, LocalFolder>;
};

export default class LocalTreeBuilder {
  private static async traverse({
    context,
    tree,
    currentFolder,
  }: {
    context: BackupsContext;
    tree: LocalTree;
    currentFolder: LocalFolder;
  }) {
    const { files, folders } = await CLSFsLocalItemsGenerator.getAll({ context, dir: currentFolder.absolutePath });

    files.forEach((fileAttributes) => {
      if (fileAttributes.size === 0) {
        return;
      }

      const relativePath = createRelativePath(relative(tree.root.absolutePath, fileAttributes.path));

      tree.files[relativePath] = {
        absolutePath: fileAttributes.path,
        relativePath,
        modificationTime: fileAttributes.modificationTime,
        size: new LocalFileSize(fileAttributes.size),
      };
    });

    for (const folderAttributes of folders) {
      const relativePath = createRelativePath(relative(tree.root.absolutePath, folderAttributes.path));

      const folder: LocalFolder = {
        absolutePath: folderAttributes.path,
        relativePath,
      };

      tree.folders[relativePath] = folder;

      await this.traverse({ context, tree, currentFolder: folder });
    }

    return tree;
  }

  static async run({ context }: { context: BackupsContext }) {
    const root = await CLSFsLocalItemsGenerator.root({ context, absolutePath: context.pathname });

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

    await this.traverse({ context, tree, currentFolder: rootFolder });

    return tree;
  }
}
