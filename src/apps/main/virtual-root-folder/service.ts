import Logger from 'electron-log';
import { app, dialog, shell } from 'electron';
import fsPromises from 'fs/promises';
import fs from 'fs';
import path from 'path';

import configStore from '../config';
import eventBus from '../event-bus';
import { getUser } from '../auth/service';
import { logger } from '@/apps/shared/logger/logger';
import { User } from '../types';
import { PATHS } from '@/core/electron/paths';

const ROOT_FOLDER_NAME = process.env.ROOT_FOLDER_NAME;
const VIRTUAL_DRIVE_FOLDER = path.join(PATHS.HOME_FOLDER_PATH, ROOT_FOLDER_NAME);

export function setSyncRoot(pathname: string): void {
  const pathNameWithSepInTheEnd = pathname[pathname.length - 1] === path.sep ? pathname : pathname + path.sep;
  const logEnginePath = path.join(app.getPath('appData'), 'internxt-drive', 'logs', 'node-win.txt');

  const logWatcherPath = path.join(app.getPath('appData'), 'internxt-drive', 'logs', 'watcher-win.txt');

  const persistQueueManager = path.join(app.getPath('appData'), 'internxt-drive', 'queue-manager.json');

  configStore.set('logEnginePath', logEnginePath);
  configStore.set('logWatcherPath', logWatcherPath);
  configStore.set('syncRoot', pathNameWithSepInTheEnd);
  configStore.set('persistQueueManagerPath', persistQueueManager);
  configStore.set('lastSavedListing', '');
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

export interface LoggersPaths {
  logEnginePath: string;
  logWatcherPath: string;
  persistQueueManagerPath: string;
  syncRoot: string;
  lastSavedListing: string;
}

export function getLoggersPaths(): LoggersPaths {
  return {
    logEnginePath: configStore.get('logEnginePath'),
    logWatcherPath: configStore.get('logWatcherPath'),
    persistQueueManagerPath: configStore.get('persistQueueManagerPath'),
    syncRoot: configStore.get('syncRoot'),
    lastSavedListing: configStore.get('lastSavedListing'),
  };
}

export async function clearRootVirtualDrive(): Promise<void> {
  try {
    const queue = path.join(app.getPath('appData'), 'internxt-drive', 'queue-manager.json');

    await fsPromises.rm(queue, { recursive: true, force: true });
  } catch (err) {
    Logger.error('Error clearing root virtual drive', err);
  }
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
  if (current === pathNameWithSepInTheEnd) {
    if (fs.existsSync(syncFolderPath)) {
      logger.debug({
        msg: 'Root virtual drive with new name format already exists, do not try to rename it',
      });
    } else {
      logger.debug({
        msg: 'Renaming root virtual drive',
      });
      fs.renameSync(current, syncFolderPath);
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
