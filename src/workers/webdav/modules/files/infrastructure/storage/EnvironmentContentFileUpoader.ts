import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core/upload/strategy';
import { Readable } from 'stream';
import {
  ContentFileUploader,
  FileUploadEvents,
} from '../../domain/ContentFileUploader';
import { Stopwatch } from '../../../../../../shared/types/Stopwatch';
import { FileActionEventEmitter } from './FileActionEventEmitter';

export class EnvironmentContentFileUpoader
  extends FileActionEventEmitter<FileUploadEvents>
  implements ContentFileUploader
{
  private stopwatch: Stopwatch;

  constructor(
    private readonly fn: UploadStrategyFunction,
    private readonly bucket: string
  ) {
    super();
    this.stopwatch = new Stopwatch();
  }

  async upload(size: number, source: Readable): Promise<string> {
    this.emit('start');
    this.stopwatch.start();

    return new Promise((resolve, reject) => {
      this.fn(this.bucket, {
        source: source,
        fileSize: size,
        finishedCallback: (err: Error | null, fileId: string) => {
          this.stopwatch.finish();

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

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
