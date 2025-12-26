import { syncWalk, SyncWalkItem } from '@/infra/file-system/services/sync-walk';
import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { parseStatError } from './parse-stat-error';
import { stat } from '@/infra/file-system/services/stat';

export type LocalTree = {
  files: Record<AbsolutePath, SyncWalkItem>;
  folders: Record<AbsolutePath, LocalFolder>;
};

export default class LocalTreeBuilder {
  static async traverse({ context, tree }: { context: BackupsContext; tree: LocalTree }) {
    const items = await syncWalk({
      rootFolder: context.pathname,
      onError: ({ path, error }) => {
        parseStatError({ context, path, error });
        logger.error({ tag: 'BACKUPS', msg: 'Error getting item stats', path, error });
      },
    });

    for (const item of items) {
      if (item.stats.isFile()) {
        tree.files[item.path] = item;
      } else if (item.stats.isDirectory()) {
        tree.folders[item.path] = { absolutePath: item.path };
      }
    }
  }

  static async run({ context }: { context: BackupsContext }) {
    const rootPath = context.pathname;

    const { error } = await stat({ absolutePath: rootPath });

    if (error) {
      parseStatError({ context, path: rootPath, error });
      throw error;
    }

    const tree: LocalTree = {
      files: {},
      folders: {
        [rootPath]: { absolutePath: rootPath },
      },
    };

    await this.traverse({ context, tree });

    return tree;
  }
}
