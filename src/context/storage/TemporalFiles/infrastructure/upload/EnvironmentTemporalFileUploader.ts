import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core/upload/strategy';
import { EventEmitter, Readable } from 'stream';
import { Stopwatch } from '../../../../../apps/shared/types/Stopwatch';

type UploadEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (contentsId: string) => void;
  error: (error: Error) => void;
};

export class EnvironmentTemporalFileUploader {
  private eventEmitter: EventEmitter;
  private stopwatch: Stopwatch;

  constructor(
    private readonly fn: UploadStrategyFunction,
    private readonly bucket: string,
    private readonly abortSignal?: AbortSignal,
  ) {
    this.eventEmitter = new EventEmitter();
    this.stopwatch = new Stopwatch();
  }

  async upload(contents: Readable, size: number): Promise<string> {
    this.eventEmitter.emit('start');
    this.stopwatch.start();

    const abortHandler = () => {
      contents.destroy();
    };

    if (this.abortSignal) {
      this.abortSignal.addEventListener('abort', abortHandler, { once: true });
    }

    try {
      const contentsId = await this.fn(this.bucket, {
        source: contents,
        fileSize: size,
        abortSignal: this.abortSignal,
        progressCallback: (progress: number) => {
          this.eventEmitter.emit('progress', progress);
        },
      });

      this.eventEmitter.emit('finish', contentsId);
      return contentsId;
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed');

      if (!contents.destroyed) {
        contents.destroy(uploadError);
      }

      this.eventEmitter.emit('error', uploadError);
      throw uploadError;
    } finally {
      this.stopwatch.finish();

      if (this.abortSignal) {
        this.abortSignal.removeEventListener('abort', abortHandler);
      }
    }
  }

  on(event: keyof UploadEvents, handler: UploadEvents[keyof UploadEvents]): void {
    this.eventEmitter.on(event, handler);
  }

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
