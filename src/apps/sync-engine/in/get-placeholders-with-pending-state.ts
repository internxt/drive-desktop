import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import VirtualDrive from '@/node-win/virtual-drive';
import { readdir } from 'fs/promises';
import { join } from 'path';

type TProps = {
  virtualDrive: VirtualDrive;
  path: string;
};

async function processFolder({ virtualDrive, path }: TProps) {
  const entries = await readdir(path, { withFileTypes: true });
  const pendingPaths: AbsolutePath[] = [];

  for (const entry of entries) {
    const absolutePath = join(path, entry.name) as AbsolutePath;

    if (entry.isDirectory()) {
      const result = await processFolder({ virtualDrive, path: absolutePath });
      pendingPaths.push(...result);
    }

    if (entry.isFile()) {
      const { error } = NodeWin.getFileUuid({ drive: virtualDrive, path: absolutePath });
      if (error?.code === 'NON_EXISTS') {
        pendingPaths.push(absolutePath);
      }
    }
  }

  return pendingPaths;
}

export async function getPlaceholdersWithPendingState({ virtualDrive, path }: TProps) {
  const start = Date.now();

  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Start get files with pending state',
    path,
  });

  const files = await processFolder({ virtualDrive, path });

  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'End get files with pending state',
    path,
    durationMs: Date.now() - start,
  });

  return files;
}
