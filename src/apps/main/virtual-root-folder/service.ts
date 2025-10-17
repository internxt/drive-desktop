import { dialog, shell } from 'electron';
import path from 'node:path';

import configStore from '../config';
import { getUserOrThrow } from '../auth/service';
import { logger } from '@/apps/shared/logger/logger';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { migrateOldSyncRoot, OLD_SYNC_ROOT } from './migrate-old-root-folder';

function setSyncRoot(pathname: string): void {
  const pathNameWithSepInTheEnd = pathname[pathname.length - 1] === path.sep ? pathname : pathname + path.sep;

  configStore.set('syncRoot', pathNameWithSepInTheEnd);
}

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

export async function chooseSyncRootWithDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled) {
    const chosenPath = result.filePaths[0];

    setSyncRoot(chosenPath);

    return chosenPath;
  }

  return null;
}

export async function openVirtualDriveRootFolder() {
  const syncFolderPath = getRootVirtualDrive();

  const errorMessage = await shell.openPath(syncFolderPath);

  if (errorMessage) throw new Error(errorMessage);
}
