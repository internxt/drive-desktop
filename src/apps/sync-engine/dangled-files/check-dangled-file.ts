import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { FileSystemModule } from '@internxt/drive-desktop-core/build/backend';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type Props = { ctx: ProcessSyncContext; file: ExtendedDriveFile };

export async function checkDangledFile({ ctx, file }: Props) {
  try {
    ctx.logger.debug({ msg: 'Checking possible dangled file', path: file.absolutePath });

    const { data, error } = await ctx.contentsDownloader.download({
      path: file.absolutePath,
      contentsId: file.contentsId,
    });

    if (data) {
      ctx.logger.debug({ msg: 'Not dangled file', path: file.absolutePath });

      await SqliteModule.FileModule.updateByUuid({ uuid: file.uuid, payload: { isDangledStatus: false } });

      ctx.contentsDownloader.forceStop({ path: file.absolutePath });

      return;
    }

    if (error.message.includes('not found')) {
      ctx.logger.warn({ msg: 'Dangled file found', path: file.absolutePath, error });

      const stats = await FileSystemModule.statThrow({ absolutePath: file.absolutePath });

      await updateContentsId({
        ctx,
        path: file.absolutePath,
        uuid: file.uuid,
        stats,
      });
    } else {
      ctx.logger.warn({ msg: 'Error downloading dangled file', path: file.absolutePath, error });
    }
  } catch (error) {
    ctx.logger.warn({ msg: 'Error checking possible dangled file', path: file.absolutePath, error });
  }
}
