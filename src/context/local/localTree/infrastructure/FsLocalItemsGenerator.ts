import fs from 'fs/promises';
import path from 'path';
import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import { LocalFileDTO } from './LocalFileDTO';
import { LocalFolderDTO } from './LocalFolderDTO';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { BackupsIssue } from '@/apps/main/background-processes/issues';
import { StatError } from '@/infra/file-system/services/stat';
import { BackupsContext } from '@/apps/backups/BackupInfo';

function parseRootStatError({ cause }: { cause: Exclude<StatError['cause'], 'UNKNOWN'> }): BackupsIssue['error'] {
  switch (cause) {
    case 'NON_EXISTS':
      return 'ROOT_FOLDER_DOES_NOT_EXIST';
    case 'NO_ACCESS':
      return 'ROOT_FOLDER_DOES_NOT_EXIST';
    default:
      return cause;
  }
}

function parseItemStatError({ cause }: { cause: Exclude<StatError['cause'], 'UNKNOWN'> }): BackupsIssue['error'] {
  switch (cause) {
    case 'NON_EXISTS':
      return 'FOLDER_DOES_NOT_EXIST';
    case 'NO_ACCESS':
      return 'FOLDER_ACCESS_DENIED';
    default:
      return cause;
  }
}

export class CLSFsLocalItemsGenerator {
  static async root({ context, absolutePath }: { context: BackupsContext; absolutePath: string }) {
    const { data, error } = await fileSystem.stat({ absolutePath });

    if (error) {
      if (error.cause !== 'UNKNOWN') {
        context.addIssue({
          name: absolutePath,
          error: parseRootStatError({ cause: error.cause }),
        });
      }

      throw error;
    }

    return {
      path: absolutePath as AbsolutePath,
      modificationTime: data.mtime.getTime(),
    };
  }

  static async getAll({ context, dir }: { context: BackupsContext; dir: string }) {
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
        if (error.cause !== 'UNKNOWN') {
          context.addIssue({
            name: absolutePath,
            error: parseItemStatError({ cause: error.cause }),
          });
        }

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
