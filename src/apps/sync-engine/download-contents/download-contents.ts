import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
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

  let offset = 0;
  let chunk: Buffer<ArrayBufferLike> | undefined;

  try {
    const { data: readable, error } = await ctx.contentsDownloader.download({
      path,
      contentsId: file.contentsId,
      onProgress: (progress) => {
        LocalSync.SyncState.addItem({ action: 'DOWNLOADING', path, progress });
      },
    });

    if (!readable) throw error;

    for await (chunk of readable) {
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
    ctx.contentsDownloader.forceStop({ path });

    /**
     * v2.6.5 Daniel Jiménez
     * WinRT error: [transfer_data] The cloud operation was canceled by user. (HRESULT: 0x8007018e)
     */
    if (error instanceof Error && error.message.includes('0x8007018e')) {
      ctx.logger.debug({ msg: 'Fetch data cancelled by user', path });
      LocalSync.SyncState.addItem({ action: 'DOWNLOAD_CANCEL', path });
      return;
    }

    ctx.logger.error({ msg: 'Error downloading file', path, size: file.size, chunk: chunk?.length, error });
    LocalSync.SyncState.addItem({ action: 'DOWNLOAD_ERROR', path });
  }
}
