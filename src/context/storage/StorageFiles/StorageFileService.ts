import { Environment } from '@internxt/inxt-js';
import { Service } from 'diod';
import { Either, left, right } from '../../shared/domain/Either';
import { customSafeDownloader } from './infrastructure/download/customSafeDownloader';
import { logger } from '@internxt/drive-desktop-core/build/backend';

@Service()
export class StorageFileService {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  async isFileDownloadable(
    fileContentsId: string
  ): Promise<Either<Error, boolean>> {
    logger.debug({
      msg: `[DOWNLOAD CHECK] Checking if file ${fileContentsId} is downloadable...`,
    });

    return new Promise<Either<Error, boolean>>((resolve) => {
      try {
        const downloader = customSafeDownloader(this.environment);
        const stream = downloader(this.bucket, fileContentsId);

        let isDownloadable = false;

        stream.on('data', () => {
          isDownloadable = true;
          logger.debug({
            msg: `[DOWNLOAD] File ${fileContentsId} is downloadable`,
          });
          stream.destroy();
          resolve(right(true));
        });

        stream.on('end', () => {
          if (!isDownloadable) {
            logger.warn({
              msg: `[DOWNLOAD] Stream ended but no data received for ${fileContentsId}`,
            });
            resolve(left(new Error('Stream ended but no data received')));
          }
          stream.destroy();
        });

        stream.on('error', (err) => {
          if (
            err.message?.includes('not found') ||
            err.message?.includes('404')
          ) {
            logger.warn({
              msg: `[DOWNLOAD] File not found ${fileContentsId}: ${err.message}`,
            });
            resolve(right(false));
          } else {
            logger.error({
              msg: `[DOWNLOAD] Error downloading file ${fileContentsId}: ${err.message}`,
            });
            resolve(left(err));
          }
          stream.destroy();
        });

        setTimeout(() => {
          if (!isDownloadable) {
            logger.warn({
              msg: `[DOWNLOAD] Timeout reached for file ${fileContentsId}`,
            });
            stream.destroy();
            resolve(left(new Error('Timeout reached')));
          }
        }, 10000);
      } catch (err: any) {
        logger.error({
          msg: `[DOWNLOAD] Error initializing downloader for file ${fileContentsId}: ${err}`,
        });
        resolve(left(err));
      }
    });
  }
}
