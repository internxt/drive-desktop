import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import drive from '@/node-win/virtual-drive';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type InMemoryFiles = Record<FileUuid, AbsolutePath>;
export type InMemoryFolders = Record<FolderUuid, AbsolutePath>;

type TProps = {
  drive: drive;
};

export async function loadInMemoryPaths({ drive }: TProps) {
  const files: InMemoryFiles = {};
  const folders: InMemoryFolders = {};

  const rootPath = drive.syncRootPath;

  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Load in memory paths', rootPath });

  const folderPaths = [rootPath];

  while (folderPaths.length > 0) {
    const folderPath = folderPaths.shift();
    if (!folderPath) continue;

    /**
     * v2.5.6 Daniel Jiménez
     * We cannot use `withFileTypes` because it treats everything as a symbolic link,
     * so we have to use `stat` for each entry.
     */
    const entries = await readdir(folderPath);

    for (const entry of entries) {
      const absolutePath = join(folderPath, entry) as AbsolutePath;
      const { data: stats } = await fileSystem.stat({ absolutePath });

      if (stats) {
        if (stats.isDirectory()) {
          folderPaths.push(absolutePath);

          const { data: uuid } = NodeWin.getFolderUuid({ drive, path: absolutePath });
          if (uuid) folders[uuid] = absolutePath;
        }

        if (stats.isFile()) {
          const { data: uuid } = NodeWin.getFileUuid({ drive, path: absolutePath });
          if (uuid) files[uuid] = absolutePath;
        }
      }
    }
  }

  return { files, folders };
}
