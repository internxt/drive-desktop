import { Dirent } from 'fs';
import { readdir } from 'fs/promises';
import { resolve } from 'path';
import { PathTypeChecker } from '../../shared/fs/PathTypeChecker ';
import { isPermissionError } from './utils/isPermissionError';

export const getFilesFromDirectory = async (dir: string, cb: (file: string) => Promise<void>): Promise<void | null> => {
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
    const isTempFileOrFolder = fullPath.toLowerCase().includes('temp') || fullPath.toLowerCase().includes('tmp');
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
        console.warn(`Skipping subdirectory "${fullPath}" due to permission error.`);
      }
    } else {
      cb(fullPath);
    }
  }
};

export const countFilesInDirectory = async (dir: string): Promise<number> => {
  let count = 0;
  const stack: string[] = [dir];

  const isFile = await PathTypeChecker.isFile(dir);

  if (isFile) {
    return 1;
  }

  while (stack.length > 0) {
    const currentDir = stack.pop()!;

    let items: Dirent[];
    try {
      items = await readdir(currentDir, { withFileTypes: true });
    } catch (err) {
      if (isPermissionError(err)) {
        console.warn(`Skipping directory "${currentDir}" due to permission error.`);
        continue;
      }
      throw err;
    }

    const nonTempItems = items.filter((item) => {
      const fullPath = resolve(currentDir, item.name);
      const isTemp = fullPath.toLowerCase().includes('temp') || fullPath.toLowerCase().includes('tmp');
      return !isTemp;
    });

    for (const item of nonTempItems) {
      const fullPath = resolve(currentDir, item.name);
      if (item.isDirectory()) {
        stack.push(fullPath);
      } else {
        count++;
      }
    }
  }

  return count;
};
