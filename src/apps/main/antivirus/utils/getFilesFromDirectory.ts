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
      Logger.debug(`Processing file: ${dir}`);
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

  const nonTempItems = items.filter((item) => {
    const fullPath = resolve(dir, item.name);
    const isTempFileOrFolder =
      fullPath.toLowerCase().includes('temp') ||
      fullPath.toLowerCase().includes('tmp');
    return !isTempFileOrFolder;
  });

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
        Logger.debug(`Processing file: ${fullPath}`);
        await cb(fullPath);
      } catch (error: unknown) {
        Logger.warn(
          `Error processing file "${fullPath}": ${getErrorMessage(error)}`
        );
      }
    }
  }
};

export async function countFilesUsingLinuxCommand(
  folder: string
): Promise<number> {
  const command = `find '${folder}' -type f | wc -l`;
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      Logger.error('Error executing find command:', stderr);
    }
    return parseInt(stdout.trim(), 10);
  } catch (error: unknown) {
    Logger.error(
      `Error counting files with find command: ${getErrorMessage(error)}`
    );
    return 0;
  }
}
