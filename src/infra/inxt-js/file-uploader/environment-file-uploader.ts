import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { Service } from 'diod';
import { Environment } from '@internxt/inxt-js/build';
import { logger } from '@/apps/shared/logger/logger';
import { EnvironmentFileUploaderError, processError } from './process-error';
import { Readable } from 'stream';
import { FileUploaderCallbacks } from './file-uploader';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import Bottleneck from 'bottleneck';

const MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024;

const limiter = new Bottleneck({ maxConcurrent: 7 });

type TProps = {
  path: string;
  readable: Readable;
  size: number;
  abortSignal: AbortSignal;
  callbacks: FileUploaderCallbacks;
};

type TReturn = Promise<{ data: ContentsId; error?: undefined } | { data?: undefined; error: EnvironmentFileUploaderError }>;

@Service()
export class EnvironmentFileUploader {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  upload({ path, readable, size, abortSignal, callbacks }: TProps): TReturn {
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

  async run(props: TProps) {
    return await limiter.schedule(() => this.upload(props));
  }
}
