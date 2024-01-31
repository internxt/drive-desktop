import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core/upload/strategy';
import { EventEmitter, Readable } from 'stream';
import { Stopwatch } from '../../../../apps/shared/types/Stopwatch';
import { OfflineContentsUploadEvents } from '../domain/OfflineContentsManagersFactory';

export class EnvironmentOfflineContentsUploader {
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

  async upload(contents: Readable, size: number): Promise<string> {
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
          resolve(contentsId);
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
    event: keyof OfflineContentsUploadEvents,
    handler: OfflineContentsUploadEvents[keyof OfflineContentsUploadEvents]
  ): void {
    this.eventEmitter.on(event, handler);
  }

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
