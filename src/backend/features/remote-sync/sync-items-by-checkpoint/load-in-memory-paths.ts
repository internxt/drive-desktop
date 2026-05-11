import { Stats } from 'node:fs';
import pLimit from 'p-limit';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { statReaddir } from '@/infra/file-system/services/stat-readdir';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FilePlaceholder } from '@/infra/node-win/services/get-file-info';

export type FileExplorerFiles = Map<FileUuid, { path: AbsolutePath; stats: Stats; placeholder: FilePlaceholder }>;
export type FileExplorerFolders = Map<FolderUuid, { path: AbsolutePath }>;

type Props = {
  ctx: SyncContext;
};

export async function loadInMemoryPaths({ ctx }: Props) {
  const files: FileExplorerFiles = new Map();
  const folders: FileExplorerFolders = new Map();
  const limit = pLimit(20);

  async function walk(parentPath: AbsolutePath) {
    const items = await statReaddir({ folder: parentPath });

    await Promise.all(
      items.files.map(({ path, stats }) =>
        limit(async () => {
          const { data: placeholder } = await NodeWin.getFileInfo({ path });
          if (placeholder) {
            files.set(placeholder.uuid, { stats, path, placeholder });
          }
        }),
      ),
    );

    for (const { path } of items.folders) {
      const { data: placeholder } = await NodeWin.getFolderInfo({ ctx, path });
      if (placeholder) {
        folders.set(placeholder.uuid, { path });
        await walk(path);
      }
    }
  }

  await walk(ctx.rootPath);

  return { files, folders };
}
