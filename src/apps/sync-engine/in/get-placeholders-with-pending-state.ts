import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { NodeWin } from '@/infra/node-win/node-win.module';
import VirtualDrive from '@/node-win/virtual-drive';
import { Stats } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

export type PendingPaths = {
  stats: Stats;
  absolutePath: AbsolutePath;
};

type TProps = {
  virtualDrive: VirtualDrive;
  path: string;
};

async function processFolder({ virtualDrive, path }: TProps) {
  const pendingFiles: PendingPaths[] = [];
  const pendingFolders: PendingPaths[] = [];

  /**
   * v2.5.6 Daniel Jiménez
   * We cannot use `withFileTypes` because it treats everything as a symbolic link,
   * so we have to use `stat` for each entry.
   */
  const entries = await readdir(path);

  for (const entry of entries) {
    const absolutePath = join(path, entry) as AbsolutePath;
    const { data: stats } = await fileSystem.stat({ absolutePath });

    if (stats) {
      if (stats.isDirectory()) {
        const { error } = NodeWin.getFolderUuid({ drive: virtualDrive, path: absolutePath });

        if (error && error.code === 'NON_EXISTS') {
          pendingFolders.push({ stats, absolutePath });
        }

        const result = await processFolder({ virtualDrive, path: absolutePath });
        pendingFiles.push(...result.pendingFiles);
        pendingFolders.push(...result.pendingFolders);
      }

      if (stats.isFile()) {
        const { error } = NodeWin.getFileUuid({ drive: virtualDrive, path: absolutePath });

        if (error && error.code === 'NON_EXISTS') {
          pendingFiles.push({ stats, absolutePath });
        }
      }
    }
  }

  return { pendingFiles, pendingFolders };
}

export async function getPlaceholdersWithPendingState({ virtualDrive, path }: TProps) {
  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Get files with pending state',
    path,
  });

  return await processFolder({ virtualDrive, path });
}
