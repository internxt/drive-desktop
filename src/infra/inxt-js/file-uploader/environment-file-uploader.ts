import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { Environment } from '@internxt/inxt-js/build';
import { logger } from '@/apps/shared/logger/logger';
import { EnvironmentFileUploaderError, processError } from './process-error';
import { Readable } from 'stream';
import { FileUploaderCallbacks } from './file-uploader';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import Bottleneck from 'bottleneck';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { abortOnChangeSize } from './abort-on-change-size';

const MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024;

const limiter = new Bottleneck({ maxConcurrent: 4 });

type TProps = {
  absolutePath: AbsolutePath;
  path: string;
  readable: Readable;
  size: number;
  abortSignal: AbortSignal;
  callbacks: FileUploaderCallbacks;
};

type TReturn = Promise<{ data: ContentsId; error?: undefined } | { data?: undefined; error: EnvironmentFileUploaderError }>;

export class EnvironmentFileUploader {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  upload({ absolutePath, path, readable, size, abortSignal, callbacks }: TProps): TReturn {
    const useMultipartUpload = size > MULTIPART_UPLOAD_SIZE_THRESHOLD;

    logger.debug({
      msg: 'Uploading file to the bucket',
      path,
      size,
      bucket: this.bucket,
      useMultipartUpload,
    });

    const fn: UploadStrategyFunction = useMultipartUpload
      ? this.environment.uploadMultipartFile.bind(this.environment)
      : this.environment.upload;

    callbacks.onProgress({ progress: 0 });

    return new Promise((resolve) => {
      const state = fn(this.bucket, {
        source: readable,
        fileSize: size,
        finishedCallback: (err, contentsId) => {
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

      void abortOnChangeSize({ absolutePath, size, resolve, stopUpload });

      abortSignal.addEventListener('abort', () => {
        logger.debug({ msg: 'Aborting upload', path });
        stopUpload();
      });
    });
  }

  async run(props: TProps) {
    return await limiter.schedule(() => this.upload(props));
  }
}
