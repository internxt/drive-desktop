import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { Service } from 'diod';
import { createReadStream } from 'fs';
import { Stopwatch } from '../../../../apps/shared/types/Stopwatch';
import { AbsolutePath } from './AbsolutePath';
import { LocalFileHandler } from '../domain/LocalFileUploader';
import { Environment } from '@internxt/inxt-js';
import { Either, left, right } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { deleteFileContentIPC } from '../../../../infra/ipc/files-ipc';
import { logger } from '@internxt/drive-desktop-core/build/backend';

@Service()
export class EnvironmentLocalFileUploader implements LocalFileHandler {
  private static MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024; // 100MB

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  upload(path: AbsolutePath, size: number, abortSignal: AbortSignal): Promise<Either<DriveDesktopError, string>> {
    const fn: UploadStrategyFunction =
      size > EnvironmentLocalFileUploader.MULTIPART_UPLOAD_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile.bind(this.environment)
        : this.environment.upload.bind(this.environment);

    const readable = createReadStream(path);

    const stopwatch = new Stopwatch();

    stopwatch.start();

    return new Promise<Either<DriveDesktopError, string>>((resolve) => {
      const state = fn(this.bucket, {
        source: readable,
        fileSize: size,
        finishedCallback: (err: Error | null, contentsId: string) => {
          readable.close();
          stopwatch.finish();

          if (err) {
            logger.error({ tag: 'SYNC-ENGINE', msg: '[ENVLFU UPLOAD ERROR]', err });
            if (err.message === 'Max space used') {
              return resolve(left(new DriveDesktopError('NOT_ENOUGH_SPACE')));
            }
            return resolve(left(new DriveDesktopError('UNKNOWN')));
          }

          resolve(right(contentsId));
        },
        progressCallback: (progress: number) => {
          logger.debug({ tag: 'SYNC-ENGINE', msg: '[UPLOAD PROGRESS]', progress });
        },
      });

      abortSignal.addEventListener('abort', () => {
        state.stop();
        readable.destroy();
      });
    });
  }

  async delete(contentsId: string): Promise<void> {
    try {
      await deleteFileContentIPC({
        bucketId: this.bucket,
        fileId: contentsId,
      });
    } catch (error) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Could not delete the file from the bucket', contentsId });
    }
  }
}
