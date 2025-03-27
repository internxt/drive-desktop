import Logger from 'electron-log';
import { app, dialog, shell } from 'electron';
import fs from 'fs/promises';
import path from 'path';

import configStore from '../config';
import eventBus from '../event-bus';
import { getUser } from '../auth/service';
import { logger } from '@/apps/shared/logger/logger';
import { User } from '../types';

const ROOT_FOLDER_NAME = process.env.ROOT_FOLDER_NAME;
const HOME_FOLDER_PATH = app.getPath('home');

const VIRTUAL_DRIVE_FOLDER = path.join(HOME_FOLDER_PATH, ROOT_FOLDER_NAME);

export async function clearDirectory(pathname: string): Promise<boolean> {
  try {
    await fs.rm(pathname, { recursive: true });
    await fs.mkdir(pathname);

    return true;
  } catch {
    return false;
  }
}

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

  if (!current.includes(user.email)) {
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

export function getRootWorkspace(workspaceId: string): string {
  const user = getUser();
  if (!user) {
    throw new Error('User not found');
  }

  const key = `${user.uuid}-${workspaceId}`;

  const current = configStore.get('workspacesPath');
  if (!current[key]) {
    const pathName = path.join(HOME_FOLDER_PATH, `${ROOT_FOLDER_NAME} - ${key}`);
    configStore.set('workspacesPath', { ...current, [key]: pathName });
    return pathName;
  }
  return current[key];
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

    await fs.rm(queue, { recursive: true, force: true });
  } catch (err) {
    Logger.error('Error clearing root virtual drive', err);
  }
}

export async function setupRootFolder(user: User): Promise<void> {
  const current = configStore.get('syncRoot');

  logger.debug({
    msg: 'Current root virtual drive in setup',
    current,
  });

  const pathNameWithSepInTheEnd = VIRTUAL_DRIVE_FOLDER + path.sep;

  const syncFolderPath = VIRTUAL_DRIVE_FOLDER + ` - ${user.email}`;

  logger.debug({
    msg: 'virtual drive folder',
    pathNameWithSepInTheEnd,
    current,
    syncFolderPath,
  });
  if (current === pathNameWithSepInTheEnd) {
    logger.debug({
      msg: 'Renaming root virtual drive',
    });
    await fs.rename(current, syncFolderPath);
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
