import * as fs from 'fs/promises';
import glob from 'tiny-glob';
import path from 'path';
import * as uuid from 'uuid';
import Logger from 'electron-log';
import { constants, createReadStream, createWriteStream } from 'fs';
import { createErrorDetails } from '../sync/utils';
import {
  FileSystem,
  Listing,
  Source,
  ReadingMetaErrorEntry,
  ProcessError,
  ProcessFatalError,
} from '../types';
import { getDateFromSeconds } from '../utils/date';

export function getLocalFilesystem(
  localPath: string,
  tempDirectory: string
): FileSystem {
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

  async function getLocalMeta(
    pathname: string
  ): Promise<{ modTimeInSeconds: number; size: number }> {
    const stat = await fs.stat(pathname);
    return {
      modTimeInSeconds: Math.trunc(stat.mtimeMs / 1000),
      size: stat.size,
    };
  }

  return {
    kind: 'LOCAL',
    async getCurrentListing() {
      const list = (
        await glob('**', {
          filesOnly: true,
          absolute: true,
          dot: true,
          cwd: localPath,
        })
      ).filter((fileName) => !/.DS_Store$/.test(fileName));
      const listing: Listing = {};
      const readingMetaErrors: ReadingMetaErrorEntry[] = [];

      for (const fileName of list) {
        const relativeName = getListingPath(fileName);
        try {
          const { modTimeInSeconds, size } = await getLocalMeta(fileName);

          if (size) listing[relativeName] = modTimeInSeconds;
          else {
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
                `Size of file is ${size}`
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
              `File name is ${fileName}`
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

        if (err.code !== 'ENOENT')
          throw new ProcessError(
            'UNKNOWN',
            createErrorDetails(err, 'Deleting a file locally', `Name: ${name}`)
          );
      }
    },

    pullFile(name: string, source: Source) {
      return new Promise((resolve, reject) => {
        const tmpFilePath = getTempFilePath();

        const { stream, additionalStream, ...sourceWithoutStream } = source;

        Logger.debug(`Downloading ${name} to temp location ${tmpFilePath}`);

        const writeStream = createWriteStream(tmpFilePath);

        stream.on('data', (chunk) => writeStream.write(chunk));

        stream.on('error', (err) => {
          reject(
            new ProcessError(
              'UNKNOWN',
              createErrorDetails(
                err,
                `Pulling file locally`,
                `Name: ${name}, source: ${JSON.stringify(
                  sourceWithoutStream,
                  null,
                  2
                )}`
              )
            )
          );
        });

        stream.on('end', async () => {
          try {
            writeStream.close();

            const actualPath = getActualPath(name);

            await fs.mkdir(path.parse(actualPath).dir, { recursive: true });

            await saferRenameFile(tmpFilePath, actualPath);

            const modTime = getDateFromSeconds(source.modTime);
            fs.utimes(actualPath, modTime, modTime);

            resolve();
          } catch (err) {
            if (err instanceof ProcessError) {
              reject(err);
            } else {
              reject(
                new ProcessError(
                  'UNKNOWN',
                  createErrorDetails(
                    err,
                    `Making local directory if needed and updating local modtime`,
                    `Name: ${name}, source: ${JSON.stringify(
                      sourceWithoutStream,
                      null,
                      2
                    )}`
                  )
                )
              );
            }
          }
        });
      });
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
        modTime = localMeta.modTimeInSeconds;
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
      const additionalStream = createReadStream(tmpFilePath);

      const onEndOrError = () => fs.unlink(tmpFilePath);

      stream.once('end', onEndOrError);
      stream.once('error', onEndOrError);

      Logger.debug(`Uploading ${name} from temp location ${tmpFilePath}`);

      return { stream, additionalStream, modTime, size };
    },

    async smokeTest() {
      try {
        await fs.access(localPath, constants.R_OK | constants.W_OK);
        await fs.lstat(localPath);
      } catch (err) {
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
  };
}
