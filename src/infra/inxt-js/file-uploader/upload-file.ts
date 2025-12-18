import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { ReadStream } from 'node:fs';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { processError } from './process-error';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { ActionState } from '@internxt/inxt-js/build/api';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { LocalSync } from '@/backend/features';
import { CommonContext } from '@/apps/sync-engine/config';

type Props = {
  ctx: CommonContext;
  fn: UploadStrategyFunction;
  readable: ReadStream;
  size: number;
  path: AbsolutePath;
  abortSignal: AbortSignal;
};

export function uploadFile({ ctx, fn, readable, size, abortSignal, path }: Props) {
  function stopUpload(state: ActionState) {
    state.stop();
    readable.destroy();
  }

  return new Promise<ContentsId | void>((resolve) => {
    const state = fn(ctx.bucket, {
      source: readable,
      fileSize: size,
      finishedCallback: (error, contentsId) => {
        readable.close();

        if (contentsId) return resolve(contentsId as ContentsId);

        processError({ path, error });
        return resolve();
      },
      progressCallback: async (progress) => {
        const { data: stats } = await fileSystem.stat({ absolutePath: path });

        if (stats && stats.size !== size) {
          logger.debug({ msg: 'Upload file aborted on change size', path, oldSize: size, newSize: stats.size });
          stopUpload(state);
          return resolve();
        }

        LocalSync.SyncState.addItem({ action: 'UPLOADING', path, progress });
      },
    });

    abortSignal.addEventListener('abort', () => {
      logger.debug({ msg: 'Aborting upload', path });
      stopUpload(state);
    });
  });
}
