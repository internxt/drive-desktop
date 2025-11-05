import { dialog, shell } from 'electron';

import { configStore } from '../config';
import { getUserOrThrow } from '../auth/service';
import { logger } from '@/apps/shared/logger/logger';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { migrateSyncRoot } from './migrate-sync-root';
import { PATHS } from '@/core/electron/paths';
import VirtualDrive from '@/node-win/virtual-drive';
import { workers } from '../remote-sync/store';
import { stopSyncEngineWorker } from '../background-processes/sync-engine/services/stop-sync-engine-worker';
import { sleep } from '../util';
import { spawnSyncEngineWorker } from '../background-processes/sync-engine/services/spawn-sync-engine-worker';
import { join } from 'node:path/posix';

export const OLD_SYNC_ROOT = createAbsolutePath(PATHS.HOME_FOLDER_PATH, 'InternxtDrive');

export function getRootVirtualDrive() {
  const user = getUserOrThrow();

  const defaultSyncRoot = join(PATHS.HOME_FOLDER_PATH, `InternxtDrive - ${user.uuid}`);
  const syncRoot = createAbsolutePath(configStore.get('syncRoot') || defaultSyncRoot);

  logger.debug({ msg: 'Current root virtual drive', syncRoot });

  /**
   * v2.5.1 Jonathan Arce
   * Previously, the drive name in Explorer was "InternxtDrive" and when you logged out and logged in,
   * you would delete the folder and recreate it. However, if some files weren't synced, deleting the folder
   * would cause them to be lost. Now, we won't delete the folder; instead, we'll create a new drive for each
   * login called "InternxtDrive - {user.uuid}."
   * So, we need to rename "InternxtDrive" to "InternxtDrive - {user.uuid}".
   */
  if (OLD_SYNC_ROOT === syncRoot) {
    const newSyncRoot = createAbsolutePath(PATHS.HOME_FOLDER_PATH, `InternxtDrive - ${user.uuid}`);
    migrateSyncRoot({ oldSyncRoot: OLD_SYNC_ROOT, newSyncRoot });
    return newSyncRoot;
  }

  return syncRoot;
}

export async function chooseSyncRootWithDialog() {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });

  if (result.canceled) return;

  const user = getUserOrThrow();

  const chosenPath = result.filePaths[0];

  logger.debug({ msg: 'Choose sync root with dialog', chosenPath });

  const newSyncRoot = createAbsolutePath(chosenPath, `InternxtDrive - ${user.uuid}`);
  const oldSyncRoot = createAbsolutePath(configStore.get('syncRoot'));

  if (newSyncRoot === oldSyncRoot) return;

  try {
    const worker = workers.get('');

    if (worker) {
      const { ctx } = worker;

      stopSyncEngineWorker({ worker });
      await sleep(2000);
      VirtualDrive.unregisterSyncRoot({ providerId: ctx.providerId });

      ctx.rootPath = newSyncRoot;

      migrateSyncRoot({ oldSyncRoot, newSyncRoot });
      await spawnSyncEngineWorker({ ctx });
    }
  } catch (error) {
    logger.error({ msg: 'Error migrating sync root', error });
  }

  return newSyncRoot;
}

export async function openVirtualDriveRootFolder() {
  const syncFolderPath = getRootVirtualDrive();

  const errorMessage = await shell.openPath(syncFolderPath);

  if (errorMessage) throw new Error(errorMessage);
}
