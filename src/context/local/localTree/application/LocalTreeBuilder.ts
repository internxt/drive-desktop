import { BackupsContext } from '@/apps/backups/BackupInfo';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { stat } from '@/infra/file-system/services/stat';
import { StatItem, statReaddir } from '@/infra/file-system/services/stat-readdir';

export type LocalTree = {
  files: Record<AbsolutePath, StatItem>;
  folders: AbsolutePath[];
};

export class LocalTreeBuilder {
  static async run({ ctx }: { ctx: BackupsContext }) {
    const rootPath = ctx.pathname;

    const { error } = await stat({ absolutePath: rootPath });

    if (error) {
      ctx.addIssue({ error: 'FOLDER_DOES_NOT_EXIST', name: rootPath });
      throw error;
    }

    const tree: LocalTree = {
      files: {},
      folders: [rootPath],
    };

    async function walk(parentPath: AbsolutePath) {
      const { files, folders } = await statReaddir({
        folder: parentPath,
        onError: ({ path, error }) => {
          ctx.addIssue({ error: 'FOLDER_DOES_NOT_EXIST', name: rootPath });
          ctx.logger.error({ msg: 'Error getting item stats', path, error });
        },
      });

      for (const file of files) {
        tree.files[file.path] = file;
      }

      tree.folders.push(...folders.map((folder) => folder.path));

      await Promise.all(folders.map((folder) => walk(folder.path)));
    }

    await walk(rootPath);

    return tree;
  }
}
