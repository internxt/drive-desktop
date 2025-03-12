import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { Service } from 'diod';
import { createReadStream } from 'fs';
import { Stopwatch } from '../../../../apps/shared/types/Stopwatch';
import { AbsolutePath } from './AbsolutePath';
import { LocalFileHandler } from '../domain/LocalFileUploader';
import { Environment } from '@internxt/inxt-js';
import { Axios } from 'axios';
import Logger from 'electron-log';
import { Either, left, right } from '../../../shared/domain/Either';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';

@Service()
export class EnvironmentLocalFileUploader implements LocalFileHandler {
  private static MULTIPART_UPLOAD_SIZE_THRESHOLD = 100 * 1024 * 1024; // 100MB

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
    private readonly httpClient: Axios
  ) {}

  upload(
    path: AbsolutePath,
    size: number,
    abortSignal: AbortSignal
  ): Promise<Either<DriveDesktopError, string>> {
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
          stopwatch.finish();

          if (err) {
            Logger.error('[ENVLFU UPLOAD ERROR]', err);
            if (err.message === 'Max space used') {
              return resolve(left(new DriveDesktopError('NOT_ENOUGH_SPACE')));
            }
            return resolve(left(new DriveDesktopError('UNKNOWN')));
          }

          resolve(right(contentsId));
        },
        progressCallback: (progress: number) => {
          Logger.debug('[UPLOAD PROGRESS]', progress);
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
      await this.httpClient.delete(
        `${process.env.API_URL}/storage/bucket/${this.bucket}/file/${contentsId}`
      );
    } catch (error) {
      // Not being able to delete from the bucket is not critical
      Logger.error(`Could not delete the file ${contentsId} from the bucket`);
    }
  }
}
