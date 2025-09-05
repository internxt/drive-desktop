import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Stats } from 'fs';
import { ProcessSyncContext } from '../config';

export type PendingPaths = {
  stats: Stats;
  absolutePath: AbsolutePath;
};

type TProps = {
  ctx: ProcessSyncContext;
  path: string;
};

async function processFolder({ ctx, path }: TProps) {
  const pendingFiles: PendingPaths[] = [];
  const pendingFolders: PendingPaths[] = [];

  const items = await fileSystem.syncWalk({ rootFolder: path });

  for (const item of items) {
    const { absolutePath, stats } = item;

    if (!stats) continue;

    if (stats.isDirectory()) {
      const { error } = NodeWin.getFolderUuid({ ctx, path: absolutePath });

      if (error && error.code === 'NON_EXISTS') {
        pendingFolders.push({ stats, absolutePath });
      }
    }

    if (stats.isFile()) {
      const { error } = NodeWin.getFileUuid({ drive: ctx.virtualDrive, path: absolutePath });

      if (error && error.code === 'NON_EXISTS') {
        pendingFiles.push({ stats, absolutePath });
      }
    }
  }

  return { pendingFiles, pendingFolders };
}

export async function getPendingItems({ ctx, path }: TProps) {
  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Get pending items',
    path,
  });

  return await processFolder({ ctx, path });
}
