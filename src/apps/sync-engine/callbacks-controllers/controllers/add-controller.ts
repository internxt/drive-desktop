import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createFile } from '@/features/sync/add-item/create-file';
import { isTemporaryFile } from '@/apps/utils/isTemporalFile';
import { Stats } from 'node:fs';
import { ProcessSyncContext } from '../../config';
import { SyncModule } from '@internxt/drive-desktop-core/build/backend';

export class AddController {
  // Gets called when:
  // - a file has been added
  // - a folder has been added
  // - a file has been saved

  static async createFile({
    ctx,
    absolutePath,
    path,
    stats,
  }: {
    ctx: ProcessSyncContext;
    absolutePath: AbsolutePath;
    path: RelativePath;
    stats: Stats;
  }) {
    logger.debug({ msg: 'Create file', path });

    try {
      if (stats.size === 0 || stats.size > SyncModule.MAX_FILE_SIZE) {
        /**
         * v2.5.6 Daniel Jiménez
         * TODO: add sync issue
         */
        logger.warn({ tag: 'SYNC-ENGINE', msg: 'Invalid file size', path, size: stats.size });
        return;
      }

      const tempFile = isTemporaryFile(path);

      if (tempFile) {
        logger.debug({ tag: 'SYNC-ENGINE', msg: 'File is temporary, skipping', path });
        return;
      }

      await createFile({
        ctx,
        absolutePath,
        path,
        stats,
      });
    } catch (error) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error in file creation', path, error });
    }
  }
}
