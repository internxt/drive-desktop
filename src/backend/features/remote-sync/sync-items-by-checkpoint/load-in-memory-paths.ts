import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Stats } from 'node:fs';
import { SyncContext } from '@/apps/sync-engine/config';
import { statReaddir } from '@/infra/file-system/services/stat-readdir';

export type FileExplorerFiles = Map<FileUuid, { path: AbsolutePath; stats: Stats }>;
export type FileExplorerFolders = Map<FolderUuid, { path: AbsolutePath }>;

type Props = {
  ctx: SyncContext;
};

export async function loadInMemoryPaths({ ctx }: Props) {
  const files: FileExplorerFiles = new Map();
  const folders: FileExplorerFolders = new Map();

  async function walk(parentPath: AbsolutePath) {
    const items = await statReaddir({ folder: parentPath });

    const filePromises = items.files.map(async ({ path, stats }) => {
      const { data: fileInfo } = await NodeWin.getFileInfo({ path });
      if (fileInfo) {
        files.set(fileInfo.uuid, { stats, path });
      }
    });

    const folderPromises = items.folders.map(async ({ path }) => {
      const { data: folderInfo } = await NodeWin.getFolderInfo({ ctx, path });
      if (folderInfo) {
        folders.set(folderInfo.uuid, { path });
        await walk(path);
      }
    });

    await Promise.all(filePromises.concat(folderPromises));
  }

  await walk(ctx.rootPath);

  return { files, folders };
}
