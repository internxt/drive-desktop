import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { parseStatError } from './parse-stat-error';
import { stat } from '@/infra/file-system/services/stat';
import { StatItem, statReaddir } from '@/infra/file-system/services/stat-readdir';

export type LocalTree = {
  files: Record<AbsolutePath, StatItem>;
  folders: Record<AbsolutePath, LocalFolder>;
};

export default class LocalTreeBuilder {
  static async run({ ctx }: { ctx: BackupsContext }) {
    const rootPath = ctx.pathname;

    const { error } = await stat({ absolutePath: rootPath });

    if (error) {
      parseStatError({ ctx, path: rootPath, error });
      throw error;
    }

    const tree: LocalTree = {
      files: {},
      folders: {
        [rootPath]: { absolutePath: rootPath },
      },
    };

    async function walk(parentPath: AbsolutePath) {
      const { files, folders } = await statReaddir({
        folder: parentPath,
        onError: ({ path, error }) => {
          parseStatError({ ctx, path, error });
          ctx.logger.error({ msg: 'Error getting item stats', path, error });
        },
      });

      for (const file of files) {
        tree.files[file.path] = file;
      }

      for (const folder of folders) {
        tree.folders[folder.path] = { absolutePath: folder.path };
      }

      await Promise.all(folders.map((folder) => walk(folder.path)));
    }

    await walk(rootPath);

    return tree;
  }
}
