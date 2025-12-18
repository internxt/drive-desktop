import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { ReadStream } from 'node:fs';
import { abortOnChangeSize } from './abort-on-change-size';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { EnvironmentFileUploaderError, processError } from './process-error';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { FileUploaderCallbacks } from './file-uploader';
import type { TResolve } from './environment-file-uploader';
import { ActionState } from '@internxt/inxt-js/build/api';
import { CommonContext } from '@/apps/sync-engine/config';

type Props = {
  ctx: CommonContext;
  fn: UploadStrategyFunction;
  readable: ReadStream;
  size: number;
  path: AbsolutePath;
  abortSignal: AbortSignal;
  callbacks: FileUploaderCallbacks;
};

export function uploadFile({ ctx, fn, readable, size, abortSignal, path, callbacks }: Props) {
  function stopUpload(state: ActionState) {
    state.stop();
    readable.destroy();
  }

  return new Promise((resolve: TResolve) => {
    let interval: NodeJS.Timeout | undefined;

    try {
      const state = fn(ctx.bucket, {
        source: readable,
        fileSize: size,
        finishedCallback: (err, contentsId) => {
          clearInterval(interval);
          readable.close();

          if (contentsId) {
            callbacks.onFinish();
            return resolve({ data: contentsId as ContentsId });
          }

          return resolve({ error: processError({ path, err, callbacks }) });
        },
        progressCallback: (progress) => {
          callbacks.onProgress({ progress });
        },
      });

      interval = setInterval(() => abortOnChangeSize({ path, size, resolve, stopUpload, state }), 5000);

      abortSignal.addEventListener('abort', () => {
        logger.debug({ msg: 'Aborting upload', path });
        stopUpload(state);
      });
    } catch (error) {
      clearInterval(interval);
      readable.close();

      logger.error({ msg: 'Error uploading file to the bucket', path, error });
      return resolve({ error: new EnvironmentFileUploaderError('UNKNOWN', error) });
    }
  });
}
