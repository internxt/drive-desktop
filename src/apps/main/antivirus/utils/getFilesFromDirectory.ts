import { Dirent } from 'fs';
import { readdir } from 'fs/promises';
import { resolve } from 'path';
import { PathTypeChecker } from '../../../shared/fs/PathTypeChecker ';
import { isPermissionError } from '../utils/isPermissionError';

export const getFilesFromDirectory = async (dir: string, cb: (file: string) => Promise<void>): Promise<void | null> => {
  let items: Dirent[];
  const isFile = await PathTypeChecker.isFile(dir);

  if (isFile) {
    void cb(dir);
    return;
  }

  try {
    items = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    const error = err;

    if (isPermissionError(error)) {
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
      }
    } else {
      void cb(fullPath);
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
      return 0;
    }
    throw err;
  }

  const nonTempItems = items.filter((item) => {
    const fullPath = resolve(folder, item.name);
    return !fullPath.toLowerCase().includes('temp') && !fullPath.toLowerCase().includes('tmp');
  });

  const chunkSize = 25;
  let total = 0;

  for (let i = 0; i < nonTempItems.length; i += chunkSize) {
    const chunk = nonTempItems.slice(i, i + chunkSize);
    const counts = await Promise.all(
      chunk.map(async (item) => {
        const fullPath = resolve(folder, item.name);
        if (item.isDirectory()) {
          try {
            return await countSystemFiles(fullPath);
          } catch (err) {
            if (!isPermissionError(err)) throw err;
            return 0;
          }
        } else {
          return 1;
        }
      }),
    );
    total += counts.reduce((sum, c) => sum + c, 0);
  }

  return total;
}
