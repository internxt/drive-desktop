import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { FileSystemModule } from '@internxt/drive-desktop-core/build/backend';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';

type Props = { ctx: ProcessSyncContext; dangledFiles: ExtendedDriveFile[] };

export async function overwriteDangledContents({ ctx, dangledFiles }: Props) {
  for (const file of dangledFiles) {
    try {
      ctx.logger.debug({ msg: 'Downloading dangled file', path: file.absolutePath });

      const { error, data } = await ctx.contentsDownloader.download({
        contentsId: file.contentsId,
        onProgress: (progress) => {
          ctx.logger.debug({ msg: 'Dangled file progress', path: file.absolutePath, progress });
          ctx.contentsDownloader.forceStop();
        },
      });

      if (data) {
        ctx.logger.debug({ msg: 'Dangled file contents found', path: file.absolutePath });

        await ipcRendererSqlite.invoke('fileUpdateByUuid', { uuid: file.uuid, payload: { isDangledStatus: false } });

        return;
      }

      if (error?.message.includes('not found')) {
        ctx.logger.warn({ msg: 'Dangled file contents not found', path: file.absolutePath, error });

        const stats = await FileSystemModule.statThrow({ absolutePath: file.absolutePath });

        await updateContentsId({ ctx, path: file.absolutePath, uuid: file.uuid, stats });
      }
    } catch (error) {
      ctx.logger.warn({ msg: 'Error overwriting dangled contents', path: file.absolutePath, error });
    }
  }
}
