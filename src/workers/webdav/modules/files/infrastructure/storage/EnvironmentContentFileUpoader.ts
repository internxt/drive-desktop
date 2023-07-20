import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core/upload/strategy';
import { Readable } from 'stream';
import {
  ContentFileUploader,
  FileUploadEvents,
} from '../../domain/ContentFileUploader';
import { FileActionEventEmitter } from './FileActionEventEmitter';

export class EnvironmentContentFileUpoader
  extends FileActionEventEmitter<FileUploadEvents>
  implements ContentFileUploader
{
  constructor(
    private readonly fn: UploadStrategyFunction,
    private readonly bucket: string
  ) {
    super();
  }

  async upload(size: number, source: Readable): Promise<string> {
    this.emit('start');

    return new Promise((resolve, reject) => {
      this.fn(this.bucket, {
        source: source,
        fileSize: size,
        finishedCallback: (err: Error | null, fileId: string) => {
          if (err) {
            this.emit('error', err);
            return reject(err);
          }
          this.emit('finish', fileId);
          resolve(fileId);
        },
        progressCallback: (progress: number) => {
          this.emit('progress', progress);
        },
      });
    });
  }
}
