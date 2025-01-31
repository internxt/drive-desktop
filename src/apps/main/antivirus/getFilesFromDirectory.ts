import { Dirent } from 'fs';
import { readdir } from 'fs/promises';
import { resolve } from 'path';
import { PathTypeChecker } from '../../shared/fs/PathTypeChecker ';
import { isPermissionError } from './utils/isPermissionError';

export const getFilesFromDirectory = async (
  dir: string,
  cb: (file: string) => Promise<void>
): Promise<void | null> => {
  let items: Dirent[];
  const isFile = await PathTypeChecker.isFile(dir);

  if (isFile) {
    cb(dir);
    return;
  }

  try {
    items = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    const error = err;

    if (isPermissionError(error)) {
      console.warn(`Skipping directory "${dir}" due to permission error.`);
      return null;
    }
    throw err;
  }

  const nonTempItems = items.filter((item) => {
    const fullPath = resolve(dir, item.name);
    const isTempFileOrFolder =
      fullPath.toLowerCase().includes('temp') ||
      fullPath.toLowerCase().includes('tmp');
    return !isTempFileOrFolder;
  });

  for (const item of nonTempItems) {
    const fullPath = resolve(dir, item.name);
    if (item.isDirectory()) {
      try {
        const subitems = await readdir(fullPath, { withFileTypes: true });
        if (subitems.length > 0) {
          await getFilesFromDirectory(fullPath, cb);
        }
      } catch (err) {
        if (!isPermissionError(err)) {
          throw err;
        }
        console.warn(
          `Skipping subdirectory "${fullPath}" due to permission error.`
        );
      }
    } else {
      cb(fullPath);
    }
  }
};

export const countFilesInDirectory = async (dir: string): Promise<number> => {
  let items: Dirent[];
  try {
    items = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (isPermissionError(err)) {
      console.warn(`Skipping directory "${dir}" due to permission error.`);
      return 0;
    }
    throw err;
  }

  let count = 0;
  const nonTempItems = items.filter((item) => {
    const fullPath = resolve(dir, item.name);
    const isTemp =
      fullPath.toLowerCase().includes('temp') ||
      fullPath.toLowerCase().includes('tmp');
    return !isTemp;
  });

  for (const item of nonTempItems) {
    const fullPath = resolve(dir, item.name);
    if (item.isDirectory()) {
      try {
        const subCount = await countFilesInDirectory(fullPath);
        count += subCount;
      } catch (subErr) {
        if (!isPermissionError(subErr)) {
          throw subErr;
        }
        console.warn(
          `Skipping subdirectory "${fullPath}" due to permission error.`
        );
      }
    } else {
      count++;
    }
  }
  return count;
};
