import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { ReadStream } from 'node:fs';
import { abortOnChangeSize } from './abort-on-change-size';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { processError } from './process-error';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { FileUploaderCallbacks } from './file-uploader';
import type { TResolve } from './environment-file-uploader';

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
    // eslint-disable-next-line prefer-const
    let interval: NodeJS.Timeout | undefined;

    callbacks.onProgress({ progress: 0 });

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

    function stopUpload() {
      state.stop();
      readable.destroy();
    }

    interval = setInterval(() => abortOnChangeSize({ path, absolutePath, size, resolve, stopUpload }), 5_000);

    abortSignal.addEventListener('abort', () => {
      logger.debug({ msg: 'Aborting upload', path });
      stopUpload();
    });
  });
}
