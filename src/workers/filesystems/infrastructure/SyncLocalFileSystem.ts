import Logger from 'electron-log';
import { constants, createReadStream, createWriteStream } from 'fs';
import * as fs from 'fs/promises';
import ignore from 'ignore';
import path from 'path';
import { pipeline } from 'stream/promises';
import glob from 'tiny-glob';
import * as uuid from 'uuid';

import ignoredFiles from '../../../../ignored-files.json';
import { LocalListing } from '../../sync/Listings/domain/Listing';
import { LocalItemMetaData } from '../../sync/Listings/domain/LocalItemMetaData';
import {
  ProcessError,
  ProcessFatalError,
  ReadingMetaErrorEntry,
  Source,
} from '../../types';
import { getDateFromSeconds } from '../../utils/date';
import { fileNameIsValid } from '../../utils/name-verification';
import { createErrorDetails } from '../../utils/reporting';
import { FileSystem } from '../domain/FileSystem';

export function getLocalFilesystem(
  localPath: string,
  tempDirectory: string
): FileSystem<LocalListing> {
  /**
   *
   * @param actualPath OS Specific absolute path
   * @returns Listing path relative to localPath with '/' as separator
   */
  function getListingPath(actualPath: string) {
    return actualPath.split(localPath)[1].replaceAll(path.sep, '/');
  }

  /**
   *
   * @param listingPath Relative to localPath with '/' as separator
   * @returns OS Specific absolute path
   */
  function getActualPath(listingPath: string) {
    const osSpecificRelative = listingPath.replaceAll('/', path.sep);

    return path.join(localPath, osSpecificRelative);
  }

  async function saferRenameFile(oldPath: string, newPath: string) {
    try {
      await fs.rename(oldPath, newPath);
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === 'EXDEV') {
        await fs.copyFile(oldPath, newPath);
        await fs.unlink(oldPath);
      } else {
        throw new ProcessError(
          'UNKNOWN',
          createErrorDetails(
            err,
            'Doing a safe rename',
            `oldPath: ${oldPath}, newPath: ${newPath}`
          )
        );
      }
    }
  }

  function getTempFilePath() {
    return path.join(tempDirectory, `${uuid.v4()}.tmp`);
  }

  async function getLocalMeta(pathname: string): Promise<LocalItemMetaData> {
    const stat = await fs.stat(pathname);

    return LocalItemMetaData.from({
      modtime: Math.trunc(stat.mtimeMs / 1000),
      size: stat.size,
      ino: stat.ino,
      dev: stat.dev,
      isFolder: stat.isDirectory(),
    });
  }

  function exists(pathname: string): Promise<boolean> {
    return new Promise((resolve) => {
      fs.stat(pathname)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }

  return {
    kind: 'LOCAL',
    async getCurrentListing() {
      const ig = ignore().add(ignoredFiles);

      const list = (
        await glob('**', {
          filesOnly: false,
          absolute: true,
          dot: true,
          cwd: localPath,
        })
      ).filter((itemPath) => {
        const relativeItemName = path.relative(localPath, itemPath);

        if (ig.ignores(relativeItemName)) {
          return false;
        }

        const isValid = fileNameIsValid(relativeItemName);
        if (!isValid) {
          Logger.warn(
            `${this.kind} file with name ${relativeItemName} will be ignored due an invalid name`
          );

          return false;
        }

        return true;
      });

      const listing: LocalListing = {};
      const readingMetaErrors: ReadingMetaErrorEntry[] = [];

      for (const itemName of list) {
        const relativeName = getListingPath(itemName);
        try {
          const metadata = await getLocalMeta(itemName);

          if (!metadata.isEmptyFile()) {
            listing[relativeName] = metadata;
          } else {
            const emptyFileError = {
              message: 'Internxt does not support empty files',
              code: '',
              stack: '',
            };
            readingMetaErrors.push({
              name: relativeName,
              errorName: 'EMPTY_FILE',
              errorDetails: createErrorDetails(
                emptyFileError,
                'Reading metadata of file',
                `Size of file is ${metadata.size}`
              ),
            });
          }
        } catch (e) {
          const err = e as { code?: string };

          readingMetaErrors.push({
            name: relativeName,
            errorName: err.code === 'EPERM' ? 'NO_PERMISSION' : 'UNKNOWN',
            errorDetails: createErrorDetails(
              err,
              'Reading metadata of file',
              `File name is ${itemName}`
            ),
          });
        }
      }

      return { listing, readingMetaErrors };
    },

    async deleteFile(name: string) {
      const actualPath = getActualPath(name);
      try {
        await fs.unlink(actualPath);
      } catch (e) {
        const err = e as { code?: string };

        if (err.code !== 'ENOENT') {
          throw new ProcessError(
            'UNKNOWN',
            createErrorDetails(err, 'Deleting a file locally', `Name: ${name}`)
          );
        }
      }
    },

    async pullFile(name: string, source: Source): Promise<void> {
      const tmpFilePath = getTempFilePath();

      const { stream: sourceFile, ...sourceWithoutStream } = source;

      Logger.debug(`Downloading ${name} to temp location ${tmpFilePath}`);

      const destination = createWriteStream(tmpFilePath);

      try {
        await pipeline(sourceFile, destination);

        const actualPath = getActualPath(name);

        await fs.mkdir(path.parse(actualPath).dir, {
          recursive: true,
        });

        await saferRenameFile(tmpFilePath, actualPath);

        const modTime = getDateFromSeconds(source.modTime);
        fs.utimes(actualPath, modTime, modTime);
      } catch (err: unknown) {
        throw new ProcessError(
          'UNKNOWN',
          createErrorDetails(
            err,
            'Pulling file locally',
            `Name: ${name}, source: ${JSON.stringify(
              sourceWithoutStream,
              null,
              2
            )}`
          )
        );
      }
    },

    async pullFolder(name, modtime): Promise<void> {
      const osSpecificRelative = name.replaceAll('/', path.sep);
      const fullPath = path.join(localPath, osSpecificRelative);

      const alreadyExists = await exists(fullPath);

      if (!alreadyExists) {
        await fs.mkdir(fullPath);
      }

      await fs.utimes(fullPath, modtime, modtime);
    },

    renameFile(oldName: string, newName: string) {
      const oldActualPath = getActualPath(oldName);
      const newActualPath = getActualPath(newName);

      return saferRenameFile(oldActualPath, newActualPath);
    },

    async existsFolder(name: string): Promise<boolean> {
      const actualPath = getActualPath(name);
      try {
        await fs.access(actualPath);

        return true;
      } catch {
        return false;
      }
    },

    deleteFolder(name: string): Promise<void> {
      const actualPath = getActualPath(name);

      return fs.rm(actualPath, { recursive: true, force: true });
    },

    async getSource(name: string): Promise<Source> {
      const actualPath = getActualPath(name);
      const tmpFilePath = getTempFilePath();

      let modTime: number | undefined;
      let size: number | undefined;

      try {
        const localMeta = await getLocalMeta(actualPath);
        modTime = localMeta.modtime;
        size = localMeta.size;

        await fs.copyFile(actualPath, tmpFilePath);
      } catch (e) {
        const err = e as { code?: string };
        const action =
          'Getting local meta and copying file to a temp directory';
        const additional = `Actual path: ${actualPath}, temp path: ${tmpFilePath}, size: ${size}, modTime: ${modTime}`;
        if (err.code === 'ENOENT') {
          throw new ProcessError(
            'NOT_EXISTS',
            createErrorDetails(err, action, additional)
          );
        } else if (err.code === 'EACCES') {
          throw new ProcessError(
            'NO_PERMISSION',
            createErrorDetails(err, action, additional)
          );
        } else {
          throw new ProcessError(
            'UNKNOWN',
            createErrorDetails(err, action, additional)
          );
        }
      }

      const stream = createReadStream(tmpFilePath);

      const onEndOrError = () => fs.unlink(tmpFilePath);

      stream.once('end', onEndOrError);
      stream.once('error', onEndOrError);

      Logger.debug(`Uploading ${name} from temp location ${tmpFilePath}`);

      return { stream, modTime, size };
    },

    async smokeTest() {
      try {
        await fs.access(localPath, constants.R_OK | constants.W_OK);
        await fs.lstat(localPath);
      } catch (err) {
        const systemError = err as { code?: string };
        if (systemError.code === 'ENOENT') {
          throw new ProcessFatalError(
            'BASE_DIRECTORY_DOES_NOT_EXIST',
            createErrorDetails(
              err,
              'Error accessing local base directory',
              `localPath: ${localPath}`
            )
          );
        }
        if (systemError.code === 'EACCES') {
          throw new ProcessFatalError(
            'INSUFICIENT_PERMISION_ACCESSING_BASE_DIRECTORY',
            createErrorDetails(
              err,
              'Error accessing local base directory',
              `localPath: ${localPath}`
            )
          );
        }
        throw new ProcessFatalError(
          'CANNOT_ACCESS_BASE_DIRECTORY',
          createErrorDetails(
            err,
            'Error accessing local base directory',
            `localPath: ${localPath}`
          )
        );
      }

      try {
        await fs.access(tempDirectory, constants.R_OK | constants.W_OK);
      } catch (err) {
        throw new ProcessFatalError(
          'CANNOT_ACCESS_TMP_DIRECTORY',
          createErrorDetails(
            err,
            'Error accessing local temp directory',
            `localPath: ${tempDirectory}`
          )
        );
      }
    },

    async getFolderData(folderName) {
      const osSpecificRelative = folderName.replaceAll('/', path.sep);
      const fullPath = path.join(localPath, osSpecificRelative);
      const folderStats = await fs.stat(fullPath);

      return {
        modtime: Math.trunc(folderStats.mtimeMs / 1000),
      };
    },
  };
}
