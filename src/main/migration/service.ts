import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import fsExtra from 'fs-extra';
import configStore from '../config';
import Logger from 'electron-log';
const DESKTOP_FOLDER_NAME = 'Moved files (Internxt Drive)';

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

  Logger.info(`Sync root folder is at ${syncRootFolder}`);
  const exists = await checkExistsDesktopFolder();

  if (!exists) {
    Logger.info(`Creating folder at ${desktopFolderPath}`);
    await fs.mkdir(desktopFolderPath, { recursive: true });
  }

  Logger.info(`Moving from ${syncRootFolder} to ${desktopFolderPath}`);
  await fsExtra.move(syncRootFolder, desktopFolderPath, { overwrite: true });
};
