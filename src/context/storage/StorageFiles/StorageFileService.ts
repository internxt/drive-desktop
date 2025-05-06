import { Environment } from '@internxt/inxt-js';
import { Service } from 'diod';
import { Either, left, right } from '../../shared/domain/Either';
import { customSafeDownloader } from './infrastructure/download/customSafeDownloader';
import Logger from 'electron-log';

@Service()
export class StorageFileService {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  async isFileDownloadable(
    fileContentsId: string
  ): Promise<Either<Error, boolean>> {
    Logger.info(
      `[DOWNLOAD CHECK] Checking if file ${fileContentsId} is downloadable...`
    );

    return new Promise<Either<Error, boolean>>((resolve) => {
      try {
        const downloader = customSafeDownloader(this.environment);
        const stream = downloader(this.bucket, fileContentsId);

        let isDownloadable = false;

        stream.on('data', () => {
          isDownloadable = true;
          Logger.info(`[DOWNLOAD] File ${fileContentsId} is downloadable`);
          stream.destroy();
          resolve(right(true));
        });

        stream.on('end', () => {
          if (!isDownloadable) {
            Logger.warn(
              `[DOWNLOAD] Stream ended but no data received for ${fileContentsId}`
            );
            resolve(left(new Error('Stream ended but no data received')));
          }
          stream.destroy();
        });

        stream.on('error', (err) => {
          if (
            err.message?.includes('not found') ||
            err.message?.includes('404')
          ) {
            Logger.warn(
              `[DOWNLOAD] File not found ${fileContentsId}: ${err.message}`
            );
            resolve(right(false));
          } else {
            Logger.error(
              `[DOWNLOAD] Error downloading file ${fileContentsId}: ${err.message}`
            );
            resolve(left(err));
          }
          stream.destroy();
        });

        setTimeout(() => {
          if (!isDownloadable) {
            Logger.warn(
              `[DOWNLOAD] Timeout reached for file ${fileContentsId}`
            );
            stream.destroy();
            resolve(left(new Error('Timeout reached')));
          }
        }, 10000);
      } catch (err: any) {
        Logger.error(
          `[DOWNLOAD] Error initializing downloader for file ${fileContentsId}: ${err}`
        );
        resolve(left(err));
      }
    });
  }
}
