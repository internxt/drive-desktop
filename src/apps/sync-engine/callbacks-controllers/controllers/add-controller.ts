import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createFile } from '@/features/sync/add-item/create-file';
import { isTemporaryFile } from '@/apps/utils/isTemporalFile';
import { Stats } from 'node:fs';
import { ProcessSyncContext } from '../../config';
import { SyncModule } from '@internxt/drive-desktop-core/build/backend';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';

export class AddController {
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
      if (stats.size === 0) {
        ctx.logger.warn({ msg: 'File is empty', path });
        return;
      }

      if (stats.size > SyncModule.MAX_FILE_SIZE) {
        ctx.logger.warn({ msg: 'File size is too big', path, size: stats.size });
        ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', { error: 'FILE_SIZE_TOO_BIG', name: path });
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
