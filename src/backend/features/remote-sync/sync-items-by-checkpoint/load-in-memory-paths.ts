import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Stats } from 'node:fs';
import { SyncContext } from '@/apps/sync-engine/config';

export type InMemoryFiles = Map<FileUuid, { path: AbsolutePath; stats: Stats }>;
export type InMemoryFolders = Map<FolderUuid, { path: AbsolutePath }>;

export async function loadInMemoryPaths({ ctx }: { ctx: SyncContext }) {
  const files: InMemoryFiles = new Map();
  const folders: InMemoryFolders = new Map();

  ctx.logger.debug({ msg: 'Load in memory paths' });

  const items = await fileSystem.syncWalk({ rootFolder: ctx.rootPath });

  for (const item of items) {
    const { path, stats } = item;

    if (!stats) continue;

    if (stats.isDirectory()) {
      const { data: folderInfo } = await NodeWin.getFolderInfo({ ctx, path });
      if (folderInfo) {
        folders.set(folderInfo.uuid, { path });
      }
    }

    if (stats.isFile()) {
      const { data: fileInfo } = await NodeWin.getFileInfo({ path });
      if (fileInfo) {
        files.set(fileInfo.uuid, { stats, path });
      }
    }
  }

  return { files, folders };
}
