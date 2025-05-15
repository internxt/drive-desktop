import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { Service } from 'diod';
import { createReadStream } from 'fs';
import { Stopwatch } from '../../../../apps/shared/types/Stopwatch';
import { AbsolutePath } from './AbsolutePath';
import { Environment } from '@internxt/inxt-js/build';
import { Either, left, right } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { logger } from '@/apps/shared/logger/logger';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

@Service()
export class EnvironmentLocalFileUploader {
  private static MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  upload(path: AbsolutePath, size: number, abortSignal: AbortSignal): Promise<Either<DriveDesktopError, string | null>> {
    const useMultipartUpload = size > EnvironmentLocalFileUploader.MULTIPART_UPLOAD_SIZE_THRESHOLD;

    logger.debug({
      tag: 'BACKUPS',
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

    return new Promise<Either<DriveDesktopError, string | null>>((resolve) => {
      const state = fn(this.bucket, {
        source: readable,
        fileSize: size,
        finishedCallback: (err: Error | null, contentsId: string) => {
          stopwatch.finish();

          if (err) {
            if (err.message === 'Process killed by user') {
              return resolve(right(null));
            } else if (err.message === 'Max space used') {
              return resolve(left(new DriveDesktopError('NOT_ENOUGH_SPACE')));
            } else {
              logger.error({
                msg: 'Failed to upload file to the bucket',
                path,
                bucket: this.bucket,
                error: err,
              });

              return resolve(left(new DriveDesktopError('UNKNOWN')));
            }
          }

          resolve(right(contentsId));
        },
        progressCallback: (progress: number) => {
          logger.debug({
            tag: 'BACKUPS',
            msg: 'Uploading file to the bucket',
            path,
            bucket: this.bucket,
            progress: `${Math.ceil(progress * 100)}%`,
          });
        },
      });

      abortSignal.addEventListener('abort', () => {
        logger.debug({
          tag: 'BACKUPS',
          msg: 'Aborting upload',
          path,
        });

        state.stop();
        readable.destroy();
      });
    });
  }

  async delete(contentsId: string) {
    await driveServerWipModule.files.deleteContentFromBucket({ bucketId: this.bucket, contentId: contentsId });
  }
}
