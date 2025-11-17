import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Stats } from 'node:fs';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

export type InMemoryFiles = Record<
  FileUuid,
  {
    absolutePath: AbsolutePath;
    stats: Stats;
  }
>;
export type InMemoryFolders = Record<FolderUuid, AbsolutePath>;

export async function loadInMemoryPaths({ ctx }: { ctx: ProcessSyncContext }) {
  const files: InMemoryFiles = {};
  const folders: InMemoryFolders = {};

  const { rootPath } = ctx;

  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Load in memory paths', rootPath });

  const items = await fileSystem.syncWalk({ rootFolder: rootPath });

  for (const item of items) {
    const { absolutePath, stats } = item;

    if (!stats) continue;

    if (stats.isDirectory()) {
      const { data: folderInfo } = NodeWin.getFolderInfo({ ctx, path: absolutePath });
      if (folderInfo) {
        folders[folderInfo.uuid] = absolutePath;
      }
    }

    if (stats.isFile()) {
      const { data: fileInfo } = NodeWin.getFileInfo({ ctx, path: absolutePath });
      if (fileInfo) {
        files[fileInfo.uuid] = { stats, absolutePath };
      }
    }
  }

  return { files, folders };
}
