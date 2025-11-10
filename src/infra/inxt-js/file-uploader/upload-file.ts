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

type Props = {
  fn: UploadStrategyFunction;
  bucket: string;
  readable: ReadStream;
  size: number;
  absolutePath: AbsolutePath;
  abortSignal: AbortSignal;
  path: string;
  callbacks: FileUploaderCallbacks;
};

export function uploadFile({ fn, bucket, readable, size, absolutePath, abortSignal, path, callbacks }: Props) {
  return new Promise((resolve: TResolve) => {
    let interval: NodeJS.Timeout | undefined;

    function stopUpload(state: ActionState) {
      state.stop();
      readable.destroy();
    }
    try {
      const state = fn(bucket, {
        source: readable,
        fileSize: size,
        finishedCallback: (err, contentsId) => {
          readable.close();
          clearInterval(interval);
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

      interval = setInterval(() => abortOnChangeSize({ path, absolutePath, size, resolve, stopUpload, state }), 5000);
      abortSignal.addEventListener('abort', () => {
        logger.debug({ msg: 'Aborting upload', path });
        stopUpload(state);
      });
    } catch (err) {
      clearInterval(interval);
      readable.close();
      return resolve({ error: new EnvironmentFileUploaderError('UNKNOWN', err) });
    }
  });
}
