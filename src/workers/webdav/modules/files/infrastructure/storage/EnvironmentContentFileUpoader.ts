import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core/upload/strategy';
import { EventEmitter, Readable } from 'stream';
import {
  ContentFileUploader,
  FileUploadEvents,
} from '../../domain/ContentFileUploader';

export class EnvironmentContentFileUpoader implements ContentFileUploader {
  private eventEmitter: EventEmitter;

  constructor(
    private readonly fn: UploadStrategyFunction,
    private readonly bucket: string,
    private readonly size: number,
    private readonly file: Promise<Readable>
  ) {
    this.eventEmitter = new EventEmitter();
  }

  async upload(): Promise<string> {
    const source = await this.file;

    this.eventEmitter.emit('start');

    return new Promise((resolve, reject) => {
      this.fn(this.bucket, {
        source,
        fileSize: this.size,
        finishedCallback: (err: Error | null, fileId: string) => {
          if (err) {
            this.eventEmitter.emit('error', err);
            return reject(err);
          }
          this.eventEmitter.emit('finish', fileId);
          resolve(fileId);
        },
        progressCallback: (progress: number) => {
          this.eventEmitter.emit('progress', progress);
        },
      });
    });
  }

  on(
    event: keyof FileUploadEvents,
    handler: FileUploadEvents[keyof FileUploadEvents]
  ): void {
    this.eventEmitter.on(event, handler);
  }
}
