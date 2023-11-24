import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core/upload/strategy';
import { EventEmitter, Readable } from 'stream';
import {
  ContentFileUploader,
  FileUploadEvents,
} from '../../domain/contentHandlers/ContentFileUploader';
import { ContentsId } from '../../domain/ContentsId';
import { Stopwatch } from '../../../../../apps/shared/types/Stopwatch';

export class EnvironmentContentFileUploader implements ContentFileUploader {
  private eventEmitter: EventEmitter;
  private stopwatch: Stopwatch;

  constructor(
    private readonly fn: UploadStrategyFunction,
    private readonly bucket: string,
    private readonly abortSignal?: AbortSignal
  ) {
    this.eventEmitter = new EventEmitter();
    this.stopwatch = new Stopwatch();
  }

  async upload(contents: Readable, size: number): Promise<ContentsId> {
    this.eventEmitter.emit('start');
    this.stopwatch.start();

    return new Promise((resolve, reject) => {
      const state = this.fn(this.bucket, {
        source: contents,
        fileSize: size,
        finishedCallback: (err: Error | null, contentsId: string) => {
          this.stopwatch.finish();

          if (err) {
            this.eventEmitter.emit('error', err);
            return reject(err);
          }
          this.eventEmitter.emit('finish', contentsId);
          resolve(new ContentsId(contentsId));
        },
        progressCallback: (progress: number) => {
          this.eventEmitter.emit('progress', progress);
        },
      });

      if (this.abortSignal) {
        this.abortSignal.addEventListener('abort', () => {
          state.stop();
          contents.destroy();
        });
      }
    });
  }

  on(
    event: keyof FileUploadEvents,
    handler: FileUploadEvents[keyof FileUploadEvents]
  ): void {
    this.eventEmitter.on(event, handler);
  }

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
