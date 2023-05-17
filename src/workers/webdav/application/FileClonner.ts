import { Environment } from '@internxt/inxt-js';
import Logger from 'electron-log';
import { Readable } from 'stream';

export class FileClonner {
  constructor(
    private readonly bucket: string,
    private readonly environment: Environment
  ) {}

  private up(readable: Readable, size: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.environment.upload(this.bucket, {
        finishedCallback: async (err: any, fileId: string) => {
          if (err) {
            Logger.debug('ERROR UPLOADING FILE');
            reject();
          }

          Logger.debug('FILE UPLOADED');
          resolve(fileId);
        },
        fileSize: size,
        source: readable,
      });
    });
  }

  clone(fileId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.environment.download(
        this.bucket,
        fileId,
        {
          finishedCallback: async (err: any, downloadStream: Readable) => {
            if (err) {
              Logger.debug('ERROR DOWNLOADING FILE');
              reject();
            }

            const id = await this.up(downloadStream, 300);
            resolve(id);
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
