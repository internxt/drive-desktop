import { LocalFile } from '../../localFile/domain/LocalFile';
import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { CLSFsLocalItemsGenerator } from '../infrastructure/FsLocalItemsGenerator';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { AbsolutePath, logger, SyncModule } from '@internxt/drive-desktop-core/build/backend';

export type LocalTree = {
  files: Record<AbsolutePath, LocalFile>;
  folders: Record<AbsolutePath, LocalFolder>;
};

export default class LocalTreeBuilder {
  static async traverse({ context, tree, currentFolder }: { context: BackupsContext; tree: LocalTree; currentFolder: LocalFolder }) {
    const { files, folders } = await CLSFsLocalItemsGenerator.getAll({ context, dir: currentFolder.absolutePath });

    for (const file of files) {
      if (file.size === 0) {
        logger.warn({ tag: 'BACKUPS', msg: 'File is empty', path: file.path });
        continue;
      }

      if (file.size > SyncModule.MAX_FILE_SIZE) {
        logger.warn({ tag: 'BACKUPS', msg: 'File size is too big', path: file.path, size: file.size });
        context.addIssue({ error: 'FILE_SIZE_TOO_BIG', name: file.path });
        continue;
      }

      tree.files[file.path] = {
        absolutePath: file.path,
        modificationTime: file.modificationTime,
        size: file.size,
      };
    }

    for (const folderAttributes of folders) {
      const folder: LocalFolder = {
        absolutePath: folderAttributes.path,
      };

      tree.folders[folder.absolutePath] = folder;
    }
  }

  static async run({ context }: { context: BackupsContext }) {
    const root = await CLSFsLocalItemsGenerator.root({ context, absolutePath: context.pathname });

    const rootFolder: LocalFolder = {
      absolutePath: root.path,
    };

    const tree: LocalTree = {
      files: {},
      folders: {
        [rootFolder.absolutePath]: rootFolder,
      },
    };

    await this.traverse({ context, tree, currentFolder: rootFolder });

    return tree;
  }
}
