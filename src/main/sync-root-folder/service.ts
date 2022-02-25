import path from 'path';
import fs from 'fs/promises';

import { app, dialog } from 'electron';

import configStore from '../config';
import eventBus from '../event-bus';

const ROOT_FOLDER_NAME = 'Internxt';
const HOME_FOLDER_PATH = app.getPath('home');

async function existsFolder(pathname: string): Promise<boolean> {
  try {
    await fs.access(pathname);
    return true;
  } catch {
    return false;
  }
}

async function isEmptyFolder(pathname: string): Promise<boolean> {
  const filesInFolder = await fs.readdir(pathname);
  return filesInFolder.length === 0;
}

function setSyncRoot(pathname: string): void {
  const pathNameWithSepInTheEnd =
    pathname[pathname.length - 1] === path.sep ? pathname : pathname + path.sep;

  configStore.set('syncRoot', pathNameWithSepInTheEnd);
  configStore.set('lastSavedListing', '');
}

export async function setupRootFolder(n = 0): Promise<void> {
  const folderName = ROOT_FOLDER_NAME;

  const rootFolderName = folderName + (n ? ` (${n})` : '');
  const rootFolderPath = path.join(HOME_FOLDER_PATH, rootFolderName);

  const notExistsOrIsEmpty =
    !(await existsFolder(rootFolderPath)) ||
    (await isEmptyFolder(rootFolderPath));

  if (notExistsOrIsEmpty) {
    await fs.mkdir(rootFolderPath, { recursive: true });
    setSyncRoot(rootFolderPath);
  } else return setupRootFolder(n + 1);
}

export async function chooseSyncRootWithDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled) {
    const chosenPath = result.filePaths[0];

    setSyncRoot(chosenPath);
    eventBus.emit('SYNC_ROOT_CHANGED', chosenPath);

    return chosenPath;
  } else {
    return null;
  }
}
