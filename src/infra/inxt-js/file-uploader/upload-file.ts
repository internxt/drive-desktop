import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { ReadStream } from 'node:fs';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { processError } from './process-error';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { LocalSync } from '@/backend/features';
import { CommonContext } from '@/apps/sync-engine/config';

type Props = {
  ctx: CommonContext;
  fn: UploadStrategyFunction;
  readable: ReadStream;
  size: number;
  path: AbsolutePath;
};

export function uploadFile({ ctx, fn, readable, size, path }: Props) {
  return new Promise<ContentsId | void>((resolve) => {
    const state = fn(ctx.bucket, {
      source: readable,
      fileSize: size,
      finishedCallback: (error, contentsId) => {
        readable.close();

        ctx.abortController.signal.removeEventListener('abort', abortHandler);

        if (contentsId) return resolve(contentsId as ContentsId);

        processError({ path, error });
        return resolve();
      },
      progressCallback: async (progress) => {
        const { data: stats } = await fileSystem.stat({ absolutePath: path });

        if (stats && stats.size !== size) {
          ctx.logger.debug({ msg: 'File size changed during upload', path, oldSize: size, newSize: stats.size });
          return abortHandler();
        }

        LocalSync.SyncState.addItem({ action: 'UPLOADING', path, progress });
      },
    });

    function abortHandler() {
      ctx.logger.debug({ msg: 'Aborting upload', path });
      state.stop();
    }

    ctx.abortController.signal.addEventListener('abort', abortHandler);
  });
}
