import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { parseStatError } from './parse-stat-error';

export class CLSFsLocalItemsGenerator {
  static async root({ context, absolutePath }: { context: BackupsContext; absolutePath: AbsolutePath }) {
    const { error } = await fileSystem.stat({ absolutePath });

    if (error) {
      parseStatError({ context, path: absolutePath, error });
      throw error;
    }

    return absolutePath;
  }

  static async getAll({ context, dir }: { context: BackupsContext; dir: AbsolutePath }) {
    return await fileSystem.syncWalk({
      rootFolder: dir,
      onError: ({ path, error }) => {
        parseStatError({ context, path, error });
        logger.error({ tag: 'BACKUPS', msg: 'Error getting item stats', path, error });
      },
    });
  }
}
