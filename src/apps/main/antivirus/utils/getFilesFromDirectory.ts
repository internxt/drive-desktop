import { Dirent } from 'fs';
import { readdir } from 'fs/promises';
import { resolve } from 'path';
import { PathTypeChecker } from '../../../shared/fs/PathTypeChecker ';
import { isPermissionError } from './isPermissionError';
import { exec } from 'child_process';
import { promisify } from 'util';
import Logger from 'electron-log';
import { getErrorMessage } from './errorUtils';

const execAsync = promisify(exec);

const isNonTempItem = (item: Dirent, dir: string): boolean => {
  const fullPath = resolve(dir, item.name);
  const isDirectory = item.isDirectory();
  return (
    (isDirectory &&
      !fullPath.toLowerCase().includes('temp') &&
      !fullPath.toLowerCase().includes('tmp')) ||
    (!isDirectory && !fullPath.toLowerCase().endsWith('.tmp'))
  );
};

export const getFilesFromDirectory = async (
  dir: string,
  cb: (file: string) => Promise<void>,
  isCancelled?: () => boolean
): Promise<void | null> => {
  if (isCancelled && isCancelled()) {
    Logger.info(`Directory traversal cancelled at ${dir}`);
    return null;
  }

  let items: Dirent[];
  const isFile = await PathTypeChecker.isFile(dir);

  if (isFile) {
    // Make sure to await the callback
    try {
      await cb(dir);
    } catch (error) {
      Logger.error(`Error processing file "${dir}": ${getErrorMessage(error)}`);
    }
    return;
  }

  try {
    items = await readdir(dir, { withFileTypes: true });
  } catch (error: unknown) {
    if (isPermissionError(error)) {
      Logger.info(
        `Skipping directory "${dir}" due to permission error: ${getErrorMessage(
          error
        )}`
      );
      return null;
    }

    // Log other errors but continue scanning
    Logger.warn(`Error reading directory "${dir}": ${getErrorMessage(error)}`);
    return null;
  }

  const nonTempItems = items.filter((item) => isNonTempItem(item, dir));

  for (const item of nonTempItems) {
    if (isCancelled && isCancelled()) {
      Logger.info(`Directory traversal cancelled during processing at ${dir}`);
      return null;
    }

    const fullPath = resolve(dir, item.name);
    if (item.isDirectory()) {
      try {
        const subitems = await readdir(fullPath, { withFileTypes: true });
        if (subitems.length > 0) {
          await getFilesFromDirectory(fullPath, cb, isCancelled);
        }
      } catch (error: unknown) {
        if (isPermissionError(error)) {
          Logger.info(
            `Skipping subdirectory "${fullPath}" due to permission error: ${getErrorMessage(
              error
            )}`
          );
        } else {
          // Log other errors but continue scanning
          Logger.warn(
            `Error accessing subdirectory "${fullPath}": ${getErrorMessage(
              error
            )}`
          );
        }
      }
    } else {
      try {
        await cb(fullPath);
      } catch (error: unknown) {
        Logger.warn(
          `Error processing file "${fullPath}": ${getErrorMessage(error)}`
        );
      }
    }
  }
};

export async function countSystemFiles(folder: string) {
  if (await PathTypeChecker.isFile(folder)) {
    return 1;
  }

  let items;
  try {
    items = await readdir(folder, { withFileTypes: true });
  } catch (err) {
    if (isPermissionError(err)) {
      Logger.warn(`Skipping directory "${folder}" due to permission error.`);
      return 0;
    }
    throw err;
  }

  const nonTempItems = items.filter((item) => isNonTempItem(item, folder));

  let total = 0;

  const counts = await Promise.all(
    nonTempItems.map(async (item) => {
      const fullPath = resolve(folder, item.name);
      if (item.isDirectory()) {
        try {
          return await countSystemFiles(fullPath);
        } catch (err) {
          if (!isPermissionError(err)) throw err;
          Logger.warn(
            `Skipping subdirectory "${fullPath}" due to permission error.`
          );
          return 0;
        }
      } else {
        return 1;
      }
    })
  );
  total += counts.reduce((sum, c) => sum + c, 0);

  return total;
}
