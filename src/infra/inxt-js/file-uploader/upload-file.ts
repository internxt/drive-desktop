import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { UploadContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { createReadStream } from '@/infra/file-system/original-fs';
import { processError } from './process-error';

type Props = {
  ctx: UploadContext;
  size: number;
  path: AbsolutePath;
  abortController: AbortController;
  attempt: number;
};

export async function uploadFile({ ctx, size, path, abortController, attempt }: Props) {
  ctx.logger.debug({
    msg: 'Uploading file to the bucket',
    path,
    size,
    bucket: ctx.bucket,
    ...(attempt > 1 && { retry: attempt }),
  });

  async function progressCallback(progress: number) {
    const { data: stats } = await fileSystem.stat({ absolutePath: path });

    if (stats && stats.size !== size) {
      ctx.logger.debug({ msg: 'File size changed during upload', path, oldSize: size, newSize: stats.size });
      abortController.abort();
      return;
    }

    LocalSync.SyncState.addItem({ action: 'UPLOADING', path, progress });
  }

  const readable = createReadStream(path);

  try {
    const contentsId = await ctx.environment.upload(ctx.bucket, {
      source: readable,
      fileSize: size,
      abortSignal: abortController.signal,
      progressCallback: (progress) => void progressCallback(progress),
    });

    return { data: contentsId as ContentsId };
  } catch (error) {
    return { error: processError({ ctx, path, size, error }) };
  } finally {
    readable.close();
  }
}
