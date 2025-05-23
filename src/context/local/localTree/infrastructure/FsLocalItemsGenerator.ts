import fs from 'fs/promises';
import path from 'path';
import { Either, left, right } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import { LocalFileDTO } from './LocalFileDTO';
import { LocalFolderDTO } from './LocalFolderDTO';

export class CLSFsLocalItemsGenerator {
  static async root(dir: string): Promise<Either<DriveDesktopError, LocalFolderDTO>> {
    try {
      const stat = await fs.stat(dir);

      if (stat.isFile()) {
        throw new Error('A file cannot be the root of a tree');
      }

      return right({
        path: dir as AbsolutePath,
        modificationTime: stat.mtime.getTime(),
      });
    } catch (err: unknown) {
      if (!(err instanceof Error)) {
        return left(new DriveDesktopError('UNKNOWN', `An unknown error happened when reading ${dir}`));
      }

      const { code } = err as { code?: string };

      if (err?.message?.includes('ENOENT')) {
        return left(new DriveDesktopError('BASE_DIRECTORY_DOES_NOT_EXIST', `${dir} does not exist`));
      }
      if (err?.message?.includes('EACCES')) {
        return left(new DriveDesktopError('INSUFFICIENT_PERMISSION', `Cannot read stats of ${dir}`));
      }

      return left(new DriveDesktopError('UNKNOWN', `An unknown error with code ${code} happened when reading ${dir}`));
    }
  }

  static async getAll(dir: string): Promise<{ files: LocalFileDTO[]; folders: LocalFolderDTO[] }> {
    const accumulator = Promise.resolve({
      files: [] as LocalFileDTO[],
      folders: [] as LocalFolderDTO[],
    });

    try {
      const dirents = await fs.readdir(dir, {
        withFileTypes: true,
      });

      return dirents.reduce(async (promise, dirent) => {
        const acc = await promise;

        const absolutePath = path.join(dir, dirent.name) as AbsolutePath;

        try {
          const stat = await fs.stat(absolutePath);

          if (dirent.isFile()) {
            acc.files.push({
              path: absolutePath,
              modificationTime: stat.mtime.getTime(),
              size: stat.size,
            });
          }

          if (dirent.isDirectory()) {
            acc.folders.push({
              path: absolutePath,
              modificationTime: stat.mtime.getTime(),
            });
          }
        } catch (error: unknown) {
          if (!(error instanceof Error)) {
            throw new DriveDesktopError('UNKNOWN', `Unexpected error while accessing ${absolutePath}: ${error}`);
          }

          if (error?.message?.includes('ENOENT')) {
            throw new DriveDesktopError('BASE_DIRECTORY_DOES_NOT_EXIST', `${dir} does not exist`);
          }

          if (error.message.includes('EPERM')) {
            throw new DriveDesktopError('INSUFFICIENT_PERMISSION', `Cannot read stats of ${absolutePath}`);
          }
          throw new DriveDesktopError('UNKNOWN', `Unexpected error while accessing ${absolutePath}: ${error.message}`);
        }

        return acc;
      }, accumulator);
    } catch (error: unknown) {
      if (!(error instanceof Error)) {
        throw new DriveDesktopError('UNKNOWN', `Unexpected error while reading directory ${dir}: ${error}`);
      }

      if (error instanceof DriveDesktopError) {
        throw error;
      }

      if (error.message.includes('EPERM')) {
        throw new DriveDesktopError('INSUFFICIENT_PERMISSION', `Cannot read directory ${dir}`);
      } else {
        throw new DriveDesktopError('UNKNOWN', `Unexpected error while accessing directory ${dir}: ${error.message}`);
      }
    }
  }
}
