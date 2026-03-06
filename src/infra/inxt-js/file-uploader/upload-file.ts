import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { ReadStream } from 'node:fs';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { LocalSync } from '@/backend/features';
import { CommonContext } from '@/apps/sync-engine/config';
import { processError } from './process-error';

type Props = {
  ctx: CommonContext;
  readable: ReadStream;
  size: number;
  path: AbsolutePath;
  abortController: AbortController;
  retry?: number;
  sleepMs?: number;
};

export async function uploadFile({ ctx, readable, size, path, abortController, retry = 1, sleepMs = 5000 }: Props) {
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
        readable,
        size,
        path,
        abortController,
        retry: retry + 1,
        sleepMs: sleepMs * 2,
      });

    return processError({ ctx, path, error, sleepMs, retryFn });
  }
}
