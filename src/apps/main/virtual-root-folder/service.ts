import { dialog, shell } from 'electron';

import { configStore } from '../config';
import { getUserOrThrow } from '../auth/service';
import { logger } from '@/apps/shared/logger/logger';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { migrateSyncRoot } from './migrate-sync-root';
import { PATHS } from '@/core/electron/paths';
import { workers } from '../background-processes/sync-engine/store';
import VirtualDrive from '@/node-win/virtual-drive';
import { sleep } from '../util';

export const OLD_SYNC_ROOT = createAbsolutePath(PATHS.HOME_FOLDER_PATH, 'InternxtDrive');

export function getRootVirtualDrive() {
  const user = getUserOrThrow();
  const syncRoot = createAbsolutePath(configStore.get('syncRoot'));

  logger.debug({ msg: 'Current root virtual drive', syncRoot });

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
    const worker = workers[''];

    if (worker && worker.browserWindow && worker.providerId) {
      const pid = worker.browserWindow.webContents.getOSProcessId();

      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'Kill sync engine worker',
        pid,
        providerId: worker.providerId,
      });

      process.kill(pid);
      await sleep(2000);
      VirtualDrive.unregisterSyncRoot({ providerId: worker.providerId });
    }
  } catch (error) {
    logger.error({ msg: 'Error stopping sync engine worker', error });
  }

  migrateSyncRoot({ oldSyncRoot, newSyncRoot });

  return newSyncRoot;
}

export async function openVirtualDriveRootFolder() {
  const syncFolderPath = getRootVirtualDrive();

  const errorMessage = await shell.openPath(syncFolderPath);

  if (errorMessage) throw new Error(errorMessage);
}
