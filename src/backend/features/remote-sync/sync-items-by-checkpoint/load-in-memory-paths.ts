import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { readdir } from 'fs/promises';
import { join } from 'path';
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

  /**
   * v2.5.6 Daniel Jiménez
   * We cannot use `withFileTypes` because it treats everything as a symbolic link,
   * so we have to use `stat` for each entry.
   */
  const entries = await readdir(rootPath, { recursive: true });

  for (const entry of entries) {
    const absolutePath = join(rootPath, entry) as AbsolutePath;
    const { data: stats } = await fileSystem.stat({ absolutePath });

    if (stats) {
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
  }

  return { files, folders };
}
