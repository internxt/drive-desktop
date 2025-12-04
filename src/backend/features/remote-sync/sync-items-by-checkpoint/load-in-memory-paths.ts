import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Stats } from 'node:fs';
import { SyncContext } from '@/apps/sync-engine/config';

export type InMemoryFiles = Record<FileUuid, { path: AbsolutePath; stats: Stats }>;
export type InMemoryFolders = Record<FolderUuid, { path: AbsolutePath }>;

export async function loadInMemoryPaths({ ctx }: { ctx: SyncContext }) {
  const files: InMemoryFiles = {};
  const folders: InMemoryFolders = {};

  const { rootPath } = ctx;

  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Load in memory paths', rootPath });

  const items = await fileSystem.syncWalk({ rootFolder: rootPath });

  for (const item of items) {
    const { path, stats } = item;

    if (!stats) continue;

    if (stats.isDirectory()) {
      const { data: folderInfo } = await NodeWin.getFolderInfo({ ctx, path });
      if (folderInfo) {
        folders[folderInfo.uuid] = { path };
      }
    }

    if (stats.isFile()) {
      const { data: fileInfo } = await NodeWin.getFileInfo({ path });
      if (fileInfo) {
        files[fileInfo.uuid] = { stats, path };
      }
    }
  }

  return { files, folders };
}
