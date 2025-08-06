import { dialog, shell } from 'electron';
import fs from 'fs';
import path from 'path';

import configStore from '../config';
import eventBus from '../event-bus';
import { getUser } from '../auth/service';
import { logger } from '@/apps/shared/logger/logger';
import { User } from '../types';
import { PATHS } from '@/core/electron/paths';
import { ROOT_FOLDER_NAME } from '@/core/utils/utils';

const VIRTUAL_DRIVE_FOLDER = path.join(PATHS.HOME_FOLDER_PATH, ROOT_FOLDER_NAME);

function setSyncRoot(pathname: string): void {
  const pathNameWithSepInTheEnd = pathname[pathname.length - 1] === path.sep ? pathname : pathname + path.sep;

  configStore.set('syncRoot', pathNameWithSepInTheEnd);
}

export function getRootVirtualDrive(): string {
  const current = configStore.get('syncRoot');
  const user = getUser();
  if (!user) {
    throw logger.error({
      msg: 'User not found when getting root virtual drive',
    });
  }

  logger.debug({
    msg: 'Current root virtual drive',
    current,
  });

  if (!current.includes(user.uuid)) {
    logger.debug({
      msg: 'Root virtual drive not found for user',
    });
    setupRootFolder(user);
    const newRoot = configStore.get('syncRoot');

    logger.debug({
      msg: 'New root virtual drive',
      newRoot,
    });
    return newRoot;
  }

  return current;
}

export function setupRootFolder(user: User): void {
  const current = configStore.get('syncRoot');

  const pathNameWithSepInTheEnd = VIRTUAL_DRIVE_FOLDER + path.sep;
  const syncFolderPath = `${VIRTUAL_DRIVE_FOLDER} - ${user.uuid}`;

  logger.debug({
    msg: 'Virtual drive folder',
    pathNameWithSepInTheEnd,
    current,
    syncFolderPath,
  });

  /**
   * v2.5.1 Jonathan Arce
   * Previously, the drive name in Explorer was "Internxt Drive" and when you logged out and logged in,
   * you would delete the folder and recreate it. However, if some files weren't synced, deleting the folder
   * would cause them to be lost. Now, we won't delete the folder; instead, we'll create a new drive for each
   * login called "Internxt Drive - {user.uuid}."
   * So, we need to rename "Internxt Drive" to "Internxt Drive - { user.uuid}".
   */
  // If the current path doesn't match the default path format, we'll still update the sync root
  if (current === pathNameWithSepInTheEnd) {
    // Check if we need to migrate to the new format with UUID
    const oldFormatExists = fs.existsSync(current);
    const newFormatExists = fs.existsSync(syncFolderPath);

    if (newFormatExists) {
      logger.debug({
        msg: 'Root virtual drive with new name format already exists',
        path: syncFolderPath,
      });
    } else if (oldFormatExists) {
      logger.debug({
        msg: 'Migrating root virtual drive to new format with UUID',
        from: current,
        to: syncFolderPath,
      });
      fs.renameSync(current, syncFolderPath);
    } else {
      logger.debug({
        msg: 'Neither old nor new format of virtual drive exists yet',
        path: syncFolderPath,
      });
    }
  }

  setSyncRoot(syncFolderPath);
}

export async function chooseSyncRootWithDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled) {
    const chosenPath = result.filePaths[0];

    setSyncRoot(chosenPath);
    eventBus.emit('SYNC_ROOT_CHANGED', chosenPath);

    return chosenPath;
  }

  return null;
}

export async function openVirtualDriveRootFolder() {
  const syncFolderPath = getRootVirtualDrive();

  const errorMessage = await shell.openPath(syncFolderPath);

  if (errorMessage) throw new Error(errorMessage);
}
