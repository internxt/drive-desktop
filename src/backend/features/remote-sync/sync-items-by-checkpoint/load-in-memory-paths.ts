import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { virtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';
import { Stats } from 'fs';

export type InMemoryFiles = Record<
  FileUuid,
  {
    absolutePath: AbsolutePath;
    stats: Stats;
  }
>;
export type InMemoryFolders = Record<FolderUuid, AbsolutePath>;

export async function loadInMemoryPaths() {
  const files: InMemoryFiles = {};
  const folders: InMemoryFolders = {};

  const rootPath = virtualDrive.syncRootPath;

  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Load in memory paths', rootPath });

  const items = await fileSystem.syncWalk({ rootFolder: rootPath });

  for (const item of items) {
    const { absolutePath, stats } = item;

    if (!stats) continue;

    if (stats.isDirectory()) {
      const { data: uuid } = NodeWin.getFolderUuid({ drive: virtualDrive, path: absolutePath });
      if (uuid) {
        folders[uuid] = absolutePath;
      }
    }

    if (stats.isFile()) {
      const { data: uuid } = NodeWin.getFileUuid({ drive: virtualDrive, path: absolutePath });
      if (uuid) {
        files[uuid] = { stats, absolutePath };
      }
    }
  }

  return { files, folders };
}
