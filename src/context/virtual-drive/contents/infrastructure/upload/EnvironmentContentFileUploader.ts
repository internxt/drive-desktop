import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core/upload/strategy';
import { EventEmitter, Readable } from 'stream';
import { ContentsId } from '../../domain/ContentsId';
import { Stopwatch } from '../../../../../apps/shared/types/Stopwatch';
import { logger } from '@/apps/shared/logger/logger';

type FileUploadEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (contentsId: string) => void;
  error: (error: Error) => void;
};

type TProps = {
  contents: Readable;
  size: number;
  path: string;
  abortSignal: AbortSignal;
};

export class EnvironmentContentFileUploader {
  private eventEmitter: EventEmitter;
  private stopwatch: Stopwatch;

  constructor(
    private readonly fn: UploadStrategyFunction,
    private readonly bucket: string,
  ) {
    this.eventEmitter = new EventEmitter();
    this.stopwatch = new Stopwatch();
  }

  upload({ contents, size, path, abortSignal }: TProps): Promise<ContentsId> {
    this.eventEmitter.emit('start');
    this.stopwatch.start();

    return new Promise((resolve, reject) => {
      const state = this.fn(this.bucket, {
        source: contents,
        fileSize: size,
        finishedCallback: (err, contentsId) => {
          this.stopwatch.finish();

          if (contentsId) {
            this.eventEmitter.emit('finish', contentsId);
            resolve(new ContentsId(contentsId));
          } else {
            this.eventEmitter.emit('error', err);
            return reject(err);
          }
        },
        progressCallback: (progress: number) => {
          this.eventEmitter.emit('progress', progress);
        },
      });

      abortSignal.addEventListener('abort', () => {
        logger.info({
          tag: 'SYNC-ENGINE',
          msg: 'Upload aborted here',
          path,
        });
        state.stop();
        contents.destroy();
      });
    });
  }

  on(event: keyof FileUploadEvents, handler: FileUploadEvents[keyof FileUploadEvents]): void {
    this.eventEmitter.on(event, handler);
  }

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
