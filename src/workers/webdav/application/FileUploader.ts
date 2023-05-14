import { Environment } from '@internxt/inxt-js';
import Logger from 'electron-log';
import { Readable } from 'stream';

export class FileUploader {
  constructor(
    private readonly bucket: string,
    private readonly environment: Environment
  ) {}

  upload(source: { size: number; contents: Readable }): Promise<string> {
    return new Promise((resolve, reject) => {
      this.environment.upload(this.bucket, {
        finishedCallback: async (err: unknown, fileId: string) => {
          if (!err) {
            Logger.debug('[REPOSITORY] FILE UPLOADED: ', fileId);
            resolve(fileId);
          } else {
            Logger.error('[REPOSITORY] ERROR UPLOADING FILE: ', err);
            reject();
          }
        },
        fileSize: source.size,
        source: source.contents,
      });
    });
  }
}
