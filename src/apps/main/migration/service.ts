import fs from 'fs/promises';
import path from 'path';
import { app, shell } from 'electron';
import fsExtra from 'fs-extra';
import configStore from '../config';
import { logger } from '@internxt/drive-desktop-core/build/backend';
const DESKTOP_FOLDER_NAME = 'Moved files (Internxt Drive)';

export const openMigrationFailedFolder = async () => {
  const desktopFolderPath = path.join(
    app.getPath('desktop'),
    DESKTOP_FOLDER_NAME
  );
  return shell.openPath(desktopFolderPath);
};
const checkExistsDesktopFolder = async () => {
  try {
    await fs.access(path.join(app.getPath('desktop'), DESKTOP_FOLDER_NAME));
    return true;
  } catch {
    return false;
  }
};
export const moveSyncFolderToDesktop = async () => {
  const desktopFolderPath = path.join(
    app.getPath('desktop'),
    DESKTOP_FOLDER_NAME
  );

  const syncRootFolder = configStore.get('syncRoot');

  if (!syncRootFolder) throw new Error('Sync Root Folder not found');

  logger.debug({ msg: `Sync root folder is at ${syncRootFolder}` });
  const exists = await checkExistsDesktopFolder();

  if (!exists) {
    logger.debug({ msg: `Creating folder at ${desktopFolderPath}` });
    await fs.mkdir(desktopFolderPath, { recursive: true });
  }

  logger.debug({
    msg: `Moving from ${syncRootFolder} to ${desktopFolderPath}`,
  });
  await fsExtra.move(syncRootFolder, desktopFolderPath, { overwrite: true });
};
