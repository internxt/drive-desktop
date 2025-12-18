import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { LocalSync } from '@/backend/features';
import { CallbackDownload } from '@/node-win/addon';

export async function downloadContents({
  ctx,
  file,
  path,
  callback,
}: {
  ctx: ProcessSyncContext;
  file: SimpleDriveFile;
  path: AbsolutePath;
  callback: CallbackDownload;
}) {
  LocalSync.SyncState.addItem({ action: 'DOWNLOADING', path, progress: 0 });

  try {
    const { data: readable, error } = await ctx.contentsDownloader.download({
      path,
      contentsId: file.contentsId,
      onProgress: (progress) => {
        LocalSync.SyncState.addItem({ action: 'DOWNLOADING', path, progress });
      },
    });

    if (!readable) throw error;

    let offset = 0;

    for await (const chunk of readable) {
      const completed = offset + chunk.length;

      if (completed >= file.size) {
        ctx.logger.debug({
          msg: 'Last chunk received',
          path,
          offset,
          chunk: chunk.length,
          size: file.size,
        });
      }

      callback(chunk, offset);

      offset += chunk.length;
    }

    ctx.logger.debug({ msg: 'File downloaded', path });

    LocalSync.SyncState.addItem({ action: 'DOWNLOADED', path });
  } catch (error) {
    if (error instanceof Error && error.message !== 'The operation was aborted') {
      ctx.logger.error({ msg: 'Error downloading file', path, error });

      LocalSync.SyncState.addItem({ action: 'DOWNLOAD_ERROR', path });

      ctx.contentsDownloader.forceStop({ path });
    }
  }
}
