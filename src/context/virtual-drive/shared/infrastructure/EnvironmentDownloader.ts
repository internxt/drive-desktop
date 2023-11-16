import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core/download/strategy';
import { EventEmitter, Readable } from 'stream';
import { Stopwatch } from '../../../../apps/shared/types/Stopwatch';

export type EnvironmentDownloaderEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (id: string) => void;
  error: (error: Error) => void;
};

export abstract class EnvironmentDownloader {
  private eventEmitter: EventEmitter;
  private stopwatch: Stopwatch;

  constructor(
    private readonly fn: DownloadStrategyFunction<unknown>,
    private readonly bucket: string
  ) {
    this.eventEmitter = new EventEmitter();
    this.stopwatch = new Stopwatch();
  }

  download(id: string): Promise<Readable> {
    this.stopwatch.start();

    this.eventEmitter.emit('start');

    return new Promise((resolve, reject) => {
      this.fn(
        this.bucket,
        id,
        {
          progressCallback: (progress: number) => {
            this.eventEmitter.emit('progress', progress);
          },
          finishedCallback: async (err: Error, stream: Readable) => {
            this.stopwatch.finish();

            if (err) {
              this.eventEmitter.emit('error', err);
              return reject(err);
            }
            this.eventEmitter.emit('finish');
            resolve(stream);
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

  on(
    event: keyof EnvironmentDownloaderEvents,
    handler: EnvironmentDownloaderEvents[keyof EnvironmentDownloaderEvents]
  ): void {
    this.eventEmitter.on(event, handler);
  }

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
