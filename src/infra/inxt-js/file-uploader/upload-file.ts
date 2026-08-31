import { createReadStream } from 'node:fs';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { CommonContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { UPLOAD_INITIAL_SLEEP_MS, UPLOAD_MAX_SLEEP_MS } from './constants';
import { processError } from './process-error';

type Props = {
  ctx: CommonContext;
  size: number;
  path: AbsolutePath;
  abortController: AbortController;
  retry?: number;
  sleepMs?: number;
};

export async function uploadFile({
  ctx,
  size,
  path,
  abortController,
  retry = 1,
  sleepMs = UPLOAD_INITIAL_SLEEP_MS,
}: Props): Promise<ContentsId | undefined> {
  ctx.logger.debug({
    msg: 'Uploading file to the bucket',
    path,
    size,
    bucket: ctx.bucket,
    ...(retry > 1 && { retry }),
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

  /**
   * A stream that a failed attempt already consumed cannot be replayed, so every
   * attempt opens its own and closes it before returning.
   */
  const readable = createReadStream(path);

  try {
    const contentsId = await ctx.environment.upload(ctx.bucket, {
      source: readable,
      fileSize: size,
      abortSignal: abortController.signal,
      progressCallback: (progress) => void progressCallback(progress),
    });

    return contentsId as ContentsId;
  } catch (error) {
    const retryFn = () =>
      uploadFile({
        ctx,
        size,
        path,
        abortController,
        retry: retry + 1,
        sleepMs: Math.min(sleepMs * 2, UPLOAD_MAX_SLEEP_MS),
      });

    return processError({ ctx, path, size, error, retry, sleepMs, retryFn });
  } finally {
    readable.close();
  }
}
