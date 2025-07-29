import fs from 'fs/promises';
import path from 'path';
import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { StatError } from '@/infra/file-system/services/stat';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { BackupsIssue } from '@internxt/drive-desktop-core/build/backend';

type LocalFileDTO = {
  path: AbsolutePath;
  modificationTime: number;
  size: number;
};

type LocalFolderDTO = {
  path: AbsolutePath;
};

function parseRootStatError({ code }: { code: Exclude<StatError['code'], 'UNKNOWN'> }): BackupsIssue['error'] {
  switch (code) {
    case 'NON_EXISTS':
      return 'ROOT_FOLDER_DOES_NOT_EXIST';
    case 'NO_ACCESS':
      return 'ROOT_FOLDER_DOES_NOT_EXIST';
    default:
      return code;
  }
}

function parseItemStatError({ code }: { code: Exclude<StatError['code'], 'UNKNOWN'> }): BackupsIssue['error'] {
  switch (code) {
    case 'NON_EXISTS':
      return 'FOLDER_DOES_NOT_EXIST';
    case 'NO_ACCESS':
      return 'FOLDER_ACCESS_DENIED';
    default:
      return code;
  }
}

export class CLSFsLocalItemsGenerator {
  static async root({ context, absolutePath }: { context: BackupsContext; absolutePath: string }) {
    const { error } = await fileSystem.stat({ absolutePath });

    if (error) {
      if (error.code !== 'UNKNOWN') {
        context.addIssue({
          name: absolutePath,
          error: parseRootStatError({ code: error.code }),
        });
      }

      throw error;
    }

    return {
      path: absolutePath as AbsolutePath,
    };
  }

  static async getAll({ context, dir }: { context: BackupsContext; dir: string }) {
    const res = {
      files: [] as LocalFileDTO[],
      folders: [] as LocalFolderDTO[],
    };

    const dirents = await fs.readdir(dir, {
      withFileTypes: true,
    });

    for (const dirent of dirents) {
      const absolutePath = path.join(dir, dirent.name) as AbsolutePath;

      const { data, error } = await fileSystem.stat({ absolutePath });

      if (error) {
        if (error.code !== 'UNKNOWN') {
          context.addIssue({
            name: absolutePath,
            error: parseItemStatError({ code: error.code }),
          });
        }

        continue;
      }

      if (dirent.isFile()) {
        res.files.push({
          path: absolutePath,
          modificationTime: data.mtime.getTime(),
          size: data.size,
        });
      } else if (dirent.isDirectory()) {
        res.folders.push({
          path: absolutePath,
        });
      }
    }

    return res;
  }
}
