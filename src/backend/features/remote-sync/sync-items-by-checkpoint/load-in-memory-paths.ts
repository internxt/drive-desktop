import pLimit from 'p-limit';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { statReaddir } from '@/infra/file-system/services/stat-readdir';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PinState } from '@/node-win/types/placeholder.type';

export type FileExplorerFiles = Map<FileUuid, { path: AbsolutePath; pinState: PinState; onDiskSize: number; size: number; mtime: Date }>;
export type FileExplorerFolders = Map<FolderUuid, { path: AbsolutePath }>;

export async function loadInMemoryPaths({ ctx }: { ctx: SyncContext }) {
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
            files.set(placeholder.uuid, {
              path,
              mtime: stats.mtime,
              size: stats.size,
              onDiskSize: placeholder.onDiskSize,
              pinState: placeholder.pinState,
            });
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
