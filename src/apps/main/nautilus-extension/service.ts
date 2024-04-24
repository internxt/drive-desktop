import { exec } from 'child_process';
import Logger from 'electron-log';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { doesFileExist } from '../../shared/fs/fileExists';

const name = 'internxt-virtual-drive.py';

const homedir = os.homedir();

const destination = `${homedir}/.local/share/nautilus-python/extensions/${name}`;

function extensionFile() {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, name);
  } else {
    return path.join(
      //@ts-ignore
      process.resourcesPath,
      'src',
      'apps',
      'nautilus-extension',
      name
    );
  }
}

export async function isInstalled(): Promise<boolean> {
  return await doesFileExist(destination);
}

export async function copyNautilusExtensionFile(): Promise<void> {
  const alreadyExists = await doesFileExist(destination);
  if (alreadyExists) return;

  const source = extensionFile();

  if (process.env.NODE_ENV !== 'production') {
    await fs.link(source, destination);
    return;
  }

  await fs.cp(source, destination);

  Logger.info('Added extension file to ', destination);
}

export async function deleteNautilusExtensionFile(): Promise<void> {
  const isThere = await doesFileExist(destination);
  if (!isThere) return;

  await fs.rm(destination);

  Logger.info('Deleted extension file from ', destination);
}

export function reloadNautilus(): Promise<void> {
  return new Promise((resolve, reject) => {
    exec('nautilus -q', (error, _, stderr) => {
      if (error) {
        if (error.code === 255) {
          // This is due to nautilus -q always returning 255 status
          resolve();
          return;
        }
        reject(error);
        return;
      }
      if (stderr) {
        reject(new Error(stderr));
        return;
      }

      resolve();
    });
  });
}
