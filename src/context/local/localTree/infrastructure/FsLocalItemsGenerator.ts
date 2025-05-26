import fs from 'fs/promises';
import path from 'path';
import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import { LocalFileDTO } from './LocalFileDTO';
import { LocalFolderDTO } from './LocalFolderDTO';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { addBackupsIssue } from '@/apps/main/background-processes/issues';

export class CLSFsLocalItemsGenerator {
  static async root(absolutePath: string) {
    const { data, error } = await fileSystem.stat({ absolutePath });

    if (error) {
      addBackupsIssue({
        name: absolutePath,
        error:
          error.cause === 'NON_EXISTS' ? 'ROOT_FOLDER_DOES_NOT_EXIST' : error.cause === 'NO_ACCESS' ? 'FOLDER_ACCESS_DENIED' : error.cause,
      });

      throw error;
    }

    return {
      path: absolutePath as AbsolutePath,
      modificationTime: data.mtime.getTime(),
    };
  }

  static async getAll(dir: string): Promise<{ files: LocalFileDTO[]; folders: LocalFolderDTO[] }> {
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

      const { data, error } = await fileSystem.stat({ absolutePath });

      if (error) {
        addBackupsIssue({
          name: absolutePath,
          error:
            error.cause === 'NON_EXISTS' ? 'FOLDER_DOES_NOT_EXIST' : error.cause === 'NO_ACCESS' ? 'FOLDER_ACCESS_DENIED' : error.cause,
        });

        return acc;
      }

      if (dirent.isFile()) {
        acc.files.push({
          path: absolutePath,
          modificationTime: data.mtime.getTime(),
          size: data.size,
        });
      } else if (dirent.isDirectory()) {
        acc.folders.push({
          path: absolutePath,
          modificationTime: data.mtime.getTime(),
        });
      }

      return acc;
    }, accumulator);
  }
}
