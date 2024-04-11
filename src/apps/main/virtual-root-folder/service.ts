import { app, dialog, shell } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import configStore from '../config';
import eventBus from '../event-bus';
import { exec } from 'child_process';

const ROOT_FOLDER_NAME = 'Internxt Drive';
const HOME_FOLDER_PATH = app.getPath('home');

const VIRTUAL_DRIVE_FOLDER = path.join(HOME_FOLDER_PATH, ROOT_FOLDER_NAME);

async function existsFolder(pathname: string): Promise<boolean> {
  try {
    await fs.access(pathname);

    return true;
  } catch {
    return false;
  }
}

export async function clearDirectory(pathname: string): Promise<boolean> {
  try {
    await fs.rm(pathname, { recursive: true });
    await fs.mkdir(pathname);

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
  const logEnginePath = path.join(
    app.getPath('appData'),
    'internxt-drive',
    'logs',
    'node-win.txt'
  );
  configStore.set('logEnginePath', logEnginePath);
  configStore.set('syncRoot', pathNameWithSepInTheEnd);
  configStore.set('lastSavedListing', '');
}

export function getRootVirtualDrive(): string {
  const current = configStore.get('syncRoot');
  if (current !== VIRTUAL_DRIVE_FOLDER) {
    setupRootFolder();
  }

  return configStore.get('syncRoot');
}

export async function setupRootFolder(n = 0): Promise<void> {
  setSyncRoot(VIRTUAL_DRIVE_FOLDER);
  return;
  const folderName = ROOT_FOLDER_NAME;

  const rootFolderName = folderName + (n ? ` (${n})` : '');
  const rootFolderPath = path.join(HOME_FOLDER_PATH, rootFolderName);

  const notExistsOrIsEmpty =
    !(await existsFolder(rootFolderPath)) ||
    (await isEmptyFolder(rootFolderPath));

  if (notExistsOrIsEmpty) {
    await fs.mkdir(rootFolderPath, { recursive: true });
    setSyncRoot(rootFolderPath);
  } else {
    return setupRootFolder(n + 1);
  }
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

  if (process.platform === 'linux') {
    // shell.openPath is not working as intended with the mounted directory
    // this is only a workaround to fix it
    return new Promise<void>((resolve, reject) => {
      exec(`xdg-open ${syncFolderPath} &`, (error) => {
        if (error) reject(error);

        resolve();
      });
    });
  }

  const errorMessage = await shell.openPath(syncFolderPath);

  if (errorMessage) throw new Error(errorMessage);
}
