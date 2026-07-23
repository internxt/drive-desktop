import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { traverseDepthFirst } from '@/backend/features/virtual-drive/tree-traversal/traverse-depth-first';
import { StatItem, statReaddir } from '@/infra/file-system/services/stat-readdir';

export type LocalTree = {
  files: Record<AbsolutePath, StatItem>;
  folders: AbsolutePath[];
};

export class LocalTreeBuilder {
  static async run({ ctx }: { ctx: BackupsContext }) {
    const rootPath = ctx.pathname;

    const tree: LocalTree = {
      files: {},
      folders: [rootPath],
    };

    await traverseDepthFirst({
      root: rootPath,
      abortSignal: ctx.abortController?.signal,
      processNode: () => true,
      processChildren: (parentPath) => {
        return this.processChildrenTree({ parentPath, ctx, tree });
      },
    });

    return tree;
  }

  private static async processChildrenTree({ parentPath, ctx, tree }: { parentPath: AbsolutePath; ctx: BackupsContext; tree: LocalTree }) {
    const { files, folders } = await statReaddir({
      folder: parentPath,
      onError: ({ path, error }) => {
        ctx.addIssue({ error: 'FOLDER_ACCESS_DENIED', name: path });
        ctx.logger.error({ msg: 'Error getting item stats', path, error });
      },
    });

    for (const file of files) {
      tree.files[file.path] = file;
    }

    tree.folders.push(...folders.map((folder) => folder.path));

    return folders.map((folder) => folder.path);
  }
}
