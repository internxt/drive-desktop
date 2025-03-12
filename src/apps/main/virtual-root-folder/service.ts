import Logger from 'electron-log';
import { app, dialog, shell } from 'electron';
import fs from 'fs/promises';
import path from 'path';

import configStore from '../config';
import eventBus from '../event-bus';
import { ENV } from '@/core/env/env';

const ROOT_FOLDER_NAME = ENV.ROOT_FOLDER_NAME;
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

function setSyncRoot(pathname: string): void {
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
  if (current !== VIRTUAL_DRIVE_FOLDER) {
    setupRootFolder();
  }

  return configStore.get('syncRoot');
}

export function getRootWorkspace(workspaceId: string): string {
  const current = configStore.get('workspacesPath');
  if (!current[workspaceId]) {
    const pathName = path.join(HOME_FOLDER_PATH, `${ROOT_FOLDER_NAME} - ${workspaceId}`);
    configStore.set('workspacesPath', { ...current, [workspaceId]: pathName });
    return pathName;
  }
  return current[workspaceId];
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
    const syncFolderPath = configStore.get('syncRoot');

    const queue = path.join(app.getPath('appData'), 'internxt-drive', 'queue-manager.json');

    await fs.rm(queue, { recursive: true, force: true });

    await fs.rm(syncFolderPath, { recursive: true, force: true });

    Logger.info(`Directory contents cleared: ${syncFolderPath}`);
  } catch (err) {
    Logger.error('Error clearing root virtual drive', err);
  }
}

export async function setupRootFolder(n = 0): Promise<void> {
  setSyncRoot(VIRTUAL_DRIVE_FOLDER);
  return;
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
