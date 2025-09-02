import { LocalFile } from '../../localFile/domain/LocalFile';
import { createRelativePath, RelativePath } from '../../localFile/infrastructure/AbsolutePath';
import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { CLSFsLocalItemsGenerator } from '../infrastructure/FsLocalItemsGenerator';
import { relative } from 'path';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';

export type LocalTree = {
  root: LocalFolder;
  files: Record<RelativePath, LocalFile>;
  folders: Record<RelativePath, LocalFolder>;
};

export default class LocalTreeBuilder {
  static async traverse({ context, tree, currentFolder }: { context: BackupsContext; tree: LocalTree; currentFolder: LocalFolder }) {
    const { files, folders } = await CLSFsLocalItemsGenerator.getAll({ context, dir: currentFolder.absolutePath });

    for (const fileAttributes of files) {
      if (fileAttributes.size === 0) {
        continue;
      }

      if (fileAttributes.size >= BucketEntry.MAX_SIZE) {
        context.addIssue({
          error: 'FILE_SIZE_TOO_BIG',
          name: fileAttributes.path,
        });

        continue;
      }

      const relativePath = createRelativePath(relative(tree.root.absolutePath, fileAttributes.path));

      tree.files[relativePath] = {
        absolutePath: fileAttributes.path,
        relativePath,
        modificationTime: fileAttributes.modificationTime,
        size: fileAttributes.size,
      };
    }

    for (const folderAttributes of folders) {
      const relativePath = createRelativePath(relative(tree.root.absolutePath, folderAttributes.path));

      const folder: LocalFolder = {
        absolutePath: folderAttributes.path,
        relativePath,
      };

      tree.folders[relativePath] = folder;
    }
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
