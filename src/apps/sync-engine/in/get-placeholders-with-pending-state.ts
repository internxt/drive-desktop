import { logger } from '@/apps/shared/logger/logger';
import { SyncState } from '@/node-win/types/placeholder.type';
import VirtualDrive from '@/node-win/virtual-drive';
import { readdir } from 'fs/promises';
import { join } from 'path';

type TProps = {
  virtualDrive: VirtualDrive;
  path: string;
};

async function processFolder({ virtualDrive, path }: TProps): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  const pendingPaths: string[] = [];

  for (const entry of entries) {
    const fullPath = join(path, entry.name);

    if (entry.isDirectory()) {
      const result = await processFolder({ virtualDrive, path: fullPath });
      pendingPaths.push(...result);
    }

    if (entry.isFile()) {
      const { syncState } = virtualDrive.getPlaceholderState({ path: fullPath });
      if (syncState === SyncState.Undefined || syncState === SyncState.NotInSync) {
        pendingPaths.push(fullPath);
      }
    }
  }

  return pendingPaths;
}

export async function getPlaceholdersWithPendingState({ virtualDrive, path }: TProps) {
  const start = Date.now();

  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Start get placeholders with pending state',
    path,
  });

  const files = await processFolder({ virtualDrive, path });

  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'End get placeholders with pending state',
    path,
    durationMs: Date.now() - start,
  });

  return files;
}
