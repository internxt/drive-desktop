import { Dirent } from 'fs';
import { readdir } from 'fs/promises';
import { resolve } from 'path';
import { PathTypeChecker } from '../../../shared/fs/PathTypeChecker ';
import { isPermissionError } from './isPermissionError';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { getErrorMessage } from './errorUtils';

const isNonTempItem = (item: Dirent, dir: string): boolean => {
  const fullPath = resolve(dir, item.name);
  const isDirectory = item.isDirectory();
  return (
    (isDirectory && !fullPath.toLowerCase().includes('temp') && !fullPath.toLowerCase().includes('tmp')) ||
    (!isDirectory && !fullPath.toLowerCase().endsWith('.tmp'))
  );
};

type Props = {
  dir: string;
  cb: (file: string) => Promise<void>;
  signal: AbortSignal;
};

export async function getFilesFromDirectory({ dir, cb, signal }: Props): Promise<void | null> {
  if (signal.aborted) {
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: `Directory traversal cancelled at ${dir}`,
    });
    return;
  }

  let items: Dirent[];
  const isFile = await PathTypeChecker.isFile(dir);

  if (isFile) {
    // Make sure to await the callback
    try {
      await cb(dir);
    } catch (error) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: `Error processing file "${dir}": ${getErrorMessage(error)}`,
        error,
      });
    }
    return;
  }

  try {
    items = await readdir(dir, { withFileTypes: true });
  } catch (error: unknown) {
    if (isPermissionError(error)) {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: `Skipping directory "${dir}" due to permission error: ${getErrorMessage(error)}`,
      });
      return;
    }

    logger.warn({
      tag: 'ANTIVIRUS',
      msg: `Error reading directory "${dir}": ${getErrorMessage(error)}`,
      error,
    });
    return;
  }

  const nonTempItems = items.filter((item) => isNonTempItem(item, dir));

  for (const item of nonTempItems) {
    if (signal.aborted) {
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `Directory traversal cancelled during processing at ${dir}`,
      });
      return;
    }

    const fullPath = resolve(dir, item.name);
    if (item.isDirectory()) {
      try {
        const subitems = await readdir(fullPath, { withFileTypes: true });
        if (subitems.length > 0) {
          await getFilesFromDirectory({ dir: fullPath, cb, signal });
        }
      } catch (error: unknown) {
        if (isPermissionError(error)) {
          logger.debug({
            tag: 'ANTIVIRUS',
            msg: `Skipping subdirectory "${fullPath}" due to permission error: ${getErrorMessage(error)}`,
          });
        } else {
          logger.warn({
            tag: 'ANTIVIRUS',
            msg: `Error accessing subdirectory "${fullPath}": ${getErrorMessage(error)}`,
            error,
          });
        }
      }
    } else {
      try {
        await cb(fullPath);
      } catch (error: unknown) {
        logger.warn({
          tag: 'ANTIVIRUS',
          msg: `Error processing file "${fullPath}": ${getErrorMessage(error)}`,
          error,
        });
      }
    }
  }
}

export async function countSystemFiles(folder: string) {
  if (await PathTypeChecker.isFile(folder)) {
    return 1;
  }

  let items;
  try {
    items = await readdir(folder, { withFileTypes: true });
  } catch (err) {
    if (isPermissionError(err)) {
      logger.warn({
        tag: 'ANTIVIRUS',
        msg: `Skipping directory "${folder}" due to permission error.`,
      });
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
          logger.warn({
            tag: 'ANTIVIRUS',
            msg: `Skipping subdirectory "${fullPath}" due to permission error.`,
          });
          return 0;
        }
      } else {
        return 1;
      }
    }),
  );
  total += counts.reduce((sum, c) => sum + c, 0);

  return total;
}
