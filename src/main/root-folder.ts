import path from 'path';
import fs from 'fs/promises';

import { app } from 'electron';

import configStore from './config';

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

export async function setupRootFolder(n = 0): Promise<void> {
  const folderName = ROOT_FOLDER_NAME;

  const rootFolderName = folderName + (n ? ` (${n})` : '');
  const rootFolderPath = path.join(HOME_FOLDER_PATH, rootFolderName);

  const notExistsOrIsEmpty =
    !(await existsFolder(rootFolderName)) ||
    (await isEmptyFolder(rootFolderName));

  if (notExistsOrIsEmpty) {
    await fs.mkdir(rootFolderPath, { recursive: true });
    configStore.set('syncRoot', path.join(rootFolderPath, path.sep));
  } else setupRootFolder(n + 1);
}
