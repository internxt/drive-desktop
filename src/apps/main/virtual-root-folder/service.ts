import { dialog, shell } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import configStore from '../config';
import eventBus from '../event-bus';
import { exec } from 'node:child_process';
import { ensureFolderExists } from '../../shared/fs/ensure-folder-exists';
import { PATHS } from '../../../core/electron/paths';

const VIRTUAL_DRIVE_FOLDER = PATHS.ROOT_DRIVE_FOLDER;
const VIRTUAL_DRIVE_FOLDER_NAME = PATHS.VIRTUAL_DRIVE_FOLDER_NAME;

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
  const pathNameWithSepInTheEnd = normalizePathname(pathname);
  configStore.set('virtualDriveRoot', pathNameWithSepInTheEnd);
  configStore.set('lastSavedListing', '');
}

export function getRootVirtualDrive(): string {
  const current = getPathFromConfig();

  if (current) {
    const resolvedCurrent = path.resolve(current);

    if (path.basename(resolvedCurrent) === VIRTUAL_DRIVE_FOLDER_NAME) {
      setupRootFolder(getBasePathFromMountPath(resolvedCurrent));
      ensureFolderExists(normalizePathname(resolvedCurrent));

      return normalizePathname(resolvedCurrent);
    }

    const mountPath = getVirtualDriveMountPath(resolvedCurrent);
    ensureFolderExists(mountPath);

    return normalizePathname(mountPath);
  }

  const fallbackPath = getBasePathFromMountPath(VIRTUAL_DRIVE_FOLDER);

  setupRootFolder(fallbackPath);

  const rootPath = getPathFromConfig();
  const mountPath = getVirtualDriveMountPath(getBasePathFromMountPath(rootPath));
  ensureFolderExists(mountPath);

  return normalizePathname(mountPath);
}

export async function chooseSyncRootWithDialog(): Promise<string | null> {
  const previousPath = getRootVirtualDrive();
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });

  if (!result.canceled) {
    const chosenPath = result.filePaths[0];

    setupRootFolder(chosenPath);
    const nextPath = getRootVirtualDrive();

    if (previousPath !== nextPath) {
      eventBus.emit('SYNC_ROOT_CHANGED', { oldPath: previousPath, newPath: nextPath });
    }

    return nextPath;
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

function normalizePathname(pathname: string) {
  return pathname.endsWith(path.sep) ? pathname : pathname + path.sep;
}

function getVirtualDriveMountPath(basePath: string) {
  return path.join(basePath, VIRTUAL_DRIVE_FOLDER_NAME);
}

function getBasePathFromMountPath(pathname: string) {
  if (path.basename(path.resolve(pathname)) === VIRTUAL_DRIVE_FOLDER_NAME) {
    return path.dirname(path.resolve(pathname));
  }

  return pathname;
}

function getPathFromConfig() {
  return configStore.get('virtualDriveRoot');
}
