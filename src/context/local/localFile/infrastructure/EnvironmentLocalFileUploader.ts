import { clientService } from './../../../../apps/shared/HttpClient/client';
import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { Service } from 'diod';
import { createReadStream } from 'fs';
import { Stopwatch } from '../../../../apps/shared/types/Stopwatch';
import { AbsolutePath } from './AbsolutePath';
import { Environment } from '@internxt/inxt-js';
import Logger from 'electron-log';
import { Either, left, right } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { logger } from '@/apps/shared/logger/logger';
import { ClientWrapperService } from '@/infra/drive-server-wip/in/client-wrapper.service';

@Service()
export class EnvironmentLocalFileUploader {
  private static MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
    private readonly client = clientService,
    private readonly clientWrapper = new ClientWrapperService(),
  ) {}

  upload(path: AbsolutePath, size: number, abortSignal: AbortSignal): Promise<Either<DriveDesktopError, string>> {
    const fn: UploadStrategyFunction =
      size > EnvironmentLocalFileUploader.MULTIPART_UPLOAD_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile.bind(this.environment)
        : this.environment.upload;

    const readable = createReadStream(path);

    const stopwatch = new Stopwatch();

    stopwatch.start();

    return new Promise<Either<DriveDesktopError, string>>((resolve) => {
      logger.debug({ msg: 'Uploading file to the bucket', path, bucket: this.bucket });
      const state = fn(this.bucket, {
        source: readable,
        fileSize: size,
        finishedCallback: (err: Error | null, contentsId: string) => {
          stopwatch.finish();

          if (err) {
            Logger.error(err);
            if (err.message === 'Max space used') {
              return resolve(left(new DriveDesktopError('NOT_ENOUGH_SPACE')));
            }
            return resolve(left(new DriveDesktopError('UNKNOWN')));
          }

          resolve(right(contentsId));
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
        state.stop();
        readable.destroy();
      });
    });
  }

  async delete(contentsId: string) {
    const promise = this.client.DELETE('/files/{bucketId}/{fileId}', { params: { path: { bucketId: this.bucket, fileId: contentsId } } });

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Get files request was not successful',
        context: {
          contentsId,
        },
        attributes: {
          method: 'DELETE',
          endpoint: '/files',
        },
      },
    });
  }
}
