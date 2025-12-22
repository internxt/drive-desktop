import { SyncWalkItem } from '@/infra/file-system/services/sync-walk';
import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { CLSFsLocalItemsGenerator } from '../infrastructure/FsLocalItemsGenerator';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export type LocalTree = {
  files: Record<AbsolutePath, SyncWalkItem>;
  folders: Record<AbsolutePath, LocalFolder>;
};

export default class LocalTreeBuilder {
  static async traverse({ context, tree, currentFolder }: { context: BackupsContext; tree: LocalTree; currentFolder: LocalFolder }) {
    const items = await CLSFsLocalItemsGenerator.getAll({ context, dir: currentFolder.absolutePath });

    for (const item of items) {
      if (item.stats.isFile()) {
        tree.files[item.path] = item;
      } else if (item.stats.isDirectory()) {
        tree.folders[item.path] = { absolutePath: item.path };
      }
    }
  }

  static async run({ context }: { context: BackupsContext }) {
    const absolutePath = await CLSFsLocalItemsGenerator.root({ context, absolutePath: context.pathname });

    const rootFolder: LocalFolder = {
      absolutePath,
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
