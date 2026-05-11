import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { statReaddir } from '@/infra/file-system/services/stat-readdir';
import { Lmdb } from '@/infra/lmdb/lmdb';
import { NodeWin } from '@/infra/node-win/node-win.module';

export async function loadInMemoryPaths({ ctx }: { ctx: SyncContext }) {
  async function walk(parentPath: AbsolutePath) {
    const items = await statReaddir({ folder: parentPath });

    const filePromises = items.files.map(async ({ path, stats }) => {
      const { data: placeholder } = await NodeWin.getFileInfo({ path });
      if (placeholder) {
        await Lmdb.addFile(placeholder.uuid, {
          path,
          mtime: stats.mtime,
          size: stats.size,
          onDiskSize: placeholder.onDiskSize,
          pinState: placeholder.pinState,
        });
      }
    });

    for (const { path } of items.folders) {
      const { data: placeholder } = await NodeWin.getFolderInfo({ ctx, path });
      if (placeholder) {
        await Lmdb.addFolder(placeholder.uuid, { path });
        await walk(path);
      }
    });

    await Promise.all([...filePromises, ...folderPromises]);
  }

  await walk(ctx.rootPath);
}
