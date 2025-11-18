import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { BackupsIssue } from '@/apps/main/background-processes/issues';
import { StatError } from '@/infra/file-system/services/stat';
import { BackupsContext } from '@/apps/backups/BackupInfo';

type LocalFileDTO = {
  path: AbsolutePath;
  modificationTime: Date;
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
  static async root({ context, absolutePath }: { context: BackupsContext; absolutePath: AbsolutePath }) {
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
      path: absolutePath,
    };
  }

  static async getAll({ context, dir }: { context: BackupsContext; dir: AbsolutePath }) {
    const res = {
      files: [] as LocalFileDTO[],
      folders: [] as LocalFolderDTO[],
    };

    const items = await fileSystem.syncWalk({ rootFolder: dir });

    for (const item of items) {
      const { absolutePath, stats, error } = item;

      if (error) {
        if (error.code !== 'UNKNOWN') {
          context.addIssue({
            name: absolutePath,
            error: parseItemStatError({ code: error.code }),
          });
        }

        continue;
      }

      if (stats.isFile()) {
        res.files.push({
          path: absolutePath,
          modificationTime: stats.mtime,
          size: stats.size,
        });
      } else if (stats.isDirectory()) {
        res.folders.push({
          path: absolutePath,
        });
      }
    }

    return res;
  }
}
