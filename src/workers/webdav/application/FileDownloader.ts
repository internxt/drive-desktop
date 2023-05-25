import { Environment } from '@internxt/inxt-js';
import { Readable } from 'stream';
import Logger from 'electron-log';
import { Nullable } from '../../../shared/types/Nullable';

export class FileDownloader {
  constructor(
    private readonly bucket: string,
    private readonly environment: Environment
  ) {}

  download(fileId: string): Promise<Nullable<Readable>> {
    return new Promise((resolve, reject) => {
      this.environment.download(
        this.bucket,
        fileId,
        {
          progressCallback: (progess: number) => {
            Logger.debug('[PROGESS] FILE: ', fileId, progess);
          },
          finishedCallback: async (err: unknown, stream: Readable) => {
            if (err) {
              Logger.debug('[REPO] ERR: ', err);
              reject(err);
            } else {
              resolve(stream);
            }
          },
        },
        {
          label: 'Dynamic',
          params: {
            useProxy: false,
            concurrency: 10,
          },
        }
      );
    });
  }
}
