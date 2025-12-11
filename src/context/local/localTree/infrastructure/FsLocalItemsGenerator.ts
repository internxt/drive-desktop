import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { StatError } from '@/infra/file-system/services/stat';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { logger } from '@internxt/drive-desktop-core/build/backend';

type LocalFileDTO = {
  path: AbsolutePath;
  modificationTime: Date;
  size: number;
};

type LocalFolderDTO = {
  path: AbsolutePath;
};

function parseStatError({ context, path, error }: { context: BackupsContext; path: AbsolutePath; error: StatError }) {
  if (error.code === 'UNKNOWN') return;

  context.addIssue({
    name: path,
    error: (() => {
      switch (error.code) {
        case 'NON_EXISTS':
          return 'FOLDER_DOES_NOT_EXIST';
        case 'NO_ACCESS':
          return 'FOLDER_ACCESS_DENIED';
        default:
          return error.code;
      }
    })(),
  });
}

export class CLSFsLocalItemsGenerator {
  static async root({ context, absolutePath }: { context: BackupsContext; absolutePath: AbsolutePath }) {
    const { error } = await fileSystem.stat({ absolutePath });

    if (error) {
      parseStatError({ context, path: absolutePath, error });
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

    const items = await fileSystem.syncWalk({
      rootFolder: dir,
      onError: ({ path, error }) => {
        parseStatError({ context, path, error });
        logger.error({ tag: 'BACKUPS', msg: 'Error getting item stats', path, error });
      },
    });

    for (const item of items) {
      const { path, stats } = item;

      if (stats.isFile()) {
        res.files.push({
          path,
          modificationTime: stats.mtime,
          size: stats.size,
        });
      } else if (stats.isDirectory()) {
        res.folders.push({ path });
      }
    }

    return res;
  }
}
