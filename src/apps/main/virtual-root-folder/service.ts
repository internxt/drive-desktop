import { dialog, shell } from 'electron';
import fs from 'fs/promises';
import path from 'node:path';
import configStore from '../config';
import eventBus from '../event-bus';
import { exec } from 'child_process';
import { ensureFolderExists } from '../../shared/fs/ensure-folder-exists';
import { PATHS } from '../../../core/electron/paths';

const VIRTUAL_DRIVE_FOLDER = PATHS.ROOT_DRIVE_FOLDER;

export async function clearDirectory(pathname: string): Promise<boolean> {
  try {
    await fs.rm(pathname, { recursive: true });
    await fs.mkdir(pathname);

    return true;
  } catch {
    return false;
  }
}

export function setupRootFolder(pathname: string): void {
  const pathNameWithSepInTheEnd = pathname[pathname.length - 1] === path.sep ? pathname : pathname + path.sep;
  configStore.set('syncRoot', pathNameWithSepInTheEnd);
  configStore.set('lastSavedListing', '');
}

export function getRootVirtualDrive(): string {
  const current = configStore.get('syncRoot');
  ensureFolderExists(current);

  if (current !== VIRTUAL_DRIVE_FOLDER) {
    setupRootFolder(VIRTUAL_DRIVE_FOLDER);
  }

  return configStore.get('syncRoot');
}

export async function chooseSyncRootWithDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled) {
    const chosenPath = result.filePaths[0];

    setupRootFolder(chosenPath);
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
      exec(`xdg-open "${syncFolderPath}"`, (error) => {
        if (error) {
          reject(error);
        }

        resolve();
      });
    });
  }

  const errorMessage = await shell.openPath(syncFolderPath);

  if (errorMessage) throw new Error(errorMessage);
}
