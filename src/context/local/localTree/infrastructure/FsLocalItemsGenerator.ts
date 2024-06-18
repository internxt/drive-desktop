import { Service } from 'diod';
import fs from 'fs/promises';
import path from 'path';
import { Either, left, right } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import { LocalItemsGenerator } from '../domain/LocalItemsGenerator';
import { LocalFileDTO } from './LocalFileDTO';
import { LocalFolderDTO } from './LocalFolderDTO';

@Service()
export class FsLocalItemsGenerator implements LocalItemsGenerator {
  async root(dir: string): Promise<Either<DriveDesktopError, LocalFolderDTO>> {
    try {
      const stat = await fs.stat(dir);

      if (stat.isFile()) {
        throw new Error('A file cannot be the root of a tree');
      }

      return right({
        path: dir as AbsolutePath,
        modificationTime: stat.mtime.getTime(),
      });
    } catch (err) {
      const { code } = err as { code?: string };

      if (code === 'ENOENT') {
        return left(
          new DriveDesktopError(
            'BASE_DIRECTORY_DOES_NOT_EXIST',
            `${dir} does not exist`
          )
        );
      }
      if (code === 'EACCES') {
        return left(
          new DriveDesktopError(
            'INSUFFICIENT_PERMISSION',
            `Cannot read stats of ${dir}`
          )
        );
      }

      return left(
        new DriveDesktopError(
          'UNKNOWN',
          `An unknown error with code ${code} happened when reading ${dir}`
        )
      );
    }
  }

  async getAll(
    dir: string
  ): Promise<{ files: LocalFileDTO[]; folders: LocalFolderDTO[] }> {
    const accumulator = Promise.resolve({
      files: [] as LocalFileDTO[],
      folders: [] as LocalFolderDTO[],
    });

    const dirents = await fs.readdir(dir, {
      withFileTypes: true,
    });

    return dirents.reduce(async (promise, dirent) => {
      const acc = await promise;

      const absolutePath = path.join(dir, dirent.name) as AbsolutePath;
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

      return acc;
    }, accumulator);
  }
}
