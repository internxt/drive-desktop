import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { Service } from 'diod';
import { createReadStream } from 'fs';
import { Environment } from '@internxt/inxt-js/build';
import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Stopwatch } from '@/apps/shared/types/Stopwatch';

const MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024;

class EnvironmentFileUploaderError extends Error {
  constructor(
    public readonly code: 'KILLED_BY_USER' | 'NOT_ENOUGH_SPACE' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type TProps = {
  path: AbsolutePath;
  size: number;
  abortSignal: AbortSignal;
};

@Service()
export class EnvironmentFileUploader {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  upload({
    path,
    size,
    abortSignal,
  }: TProps): Promise<{ data: string; error?: undefined } | { data?: undefined; error: EnvironmentFileUploaderError }> {
    const useMultipartUpload = size > MULTIPART_UPLOAD_SIZE_THRESHOLD;

    logger.debug({
      msg: 'Uploading file to the bucket',
      path,
      bucket: this.bucket,
      useMultipartUpload,
    });

    const fn: UploadStrategyFunction = useMultipartUpload
      ? this.environment.uploadMultipartFile.bind(this.environment)
      : this.environment.upload;

    const readable = createReadStream(path);

    const stopwatch = new Stopwatch();

    stopwatch.start();

    return new Promise((resolve) => {
      const state = fn(this.bucket, {
        source: readable,
        fileSize: size,
        finishedCallback: (err, contentsId) => {
          stopwatch.finish();

          if (contentsId) {
            return resolve({ data: contentsId });
          }

          if (err) {
            if (err.message === 'Process killed by user') {
              return resolve({ error: new EnvironmentFileUploaderError('KILLED_BY_USER', err) });
            } else if (err.message === 'Max space used') {
              logger.warn({
                msg: 'Failed to upload file to the bucket. Not enough space',
                path,
                bucket: this.bucket,
                error: err,
              });

              return resolve({ error: new EnvironmentFileUploaderError('NOT_ENOUGH_SPACE', err) });
            } else {
              logger.error({
                msg: 'Failed to upload file to the bucket',
                path,
                bucket: this.bucket,
                error: err,
              });
            }
          }

          return resolve({ error: new EnvironmentFileUploaderError('UNKNOWN', err) });
        },
        progressCallback: (progress: number) => {
          logger.debug({
            msg: 'Uploading file to the bucket',
            path,
            bucket: this.bucket,
            progress: `${Math.ceil(progress * 100)}%`,
          });
        },
      });

      abortSignal.addEventListener('abort', () => {
        logger.debug({
          msg: 'Aborting upload',
          path,
        });

        state.stop();
        readable.destroy();
      });
    });
  }
}
