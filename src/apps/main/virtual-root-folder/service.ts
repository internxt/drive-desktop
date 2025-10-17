import { dialog, shell } from 'electron';

import configStore from '../config';
import { getUserOrThrow } from '../auth/service';
import { logger } from '@/apps/shared/logger/logger';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { migrateOldSyncRoot, OLD_SYNC_ROOT } from './migrate-old-root-folder';

export function getRootVirtualDrive() {
  const user = getUserOrThrow();
  const syncRoot = createAbsolutePath(configStore.get('syncRoot'));

  logger.debug({ msg: 'Current root virtual drive', syncRoot });

  if (OLD_SYNC_ROOT === syncRoot) {
    const newSyncRoot = migrateOldSyncRoot({ user });
    return newSyncRoot;
  }

  return syncRoot;
}

export async function chooseSyncRootWithDialog() {
  logger.debug({ msg: 'Choose sync root with dialog' });

  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });

  if (result.canceled) return;

  const chosenPath = result.filePaths[0];

  logger.debug({ msg: 'Chosen path', chosenPath });
}

export async function openVirtualDriveRootFolder() {
  const syncFolderPath = getRootVirtualDrive();

  const errorMessage = await shell.openPath(syncFolderPath);

  if (errorMessage) throw new Error(errorMessage);
}
