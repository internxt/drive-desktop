import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core/download/strategy';
import { EventEmitter, Readable } from 'stream';
import { DownloadOneShardStrategy } from '@internxt/inxt-js/build/lib/core';
import { ActionState } from '@internxt/inxt-js/build/api';
import { logger } from '@/apps/shared/logger/logger';

export type FileDownloadEvents = {
  start: () => void;
  progress: (progress: number) => void;
  finish: (contentsId: string) => void;
  error: (error: Error) => void;
};

export class EnvironmentContentFileDownloader {
  private eventEmitter: EventEmitter;
  private state: ActionState | null;

  constructor(
    private readonly fn: DownloadStrategyFunction<DownloadOneShardStrategy>,
    private readonly bucket: string,
  ) {
    this.eventEmitter = new EventEmitter();
    this.state = null;
  }

  forceStop(): void {
    // Logger.debug('Finish emitter type', this.state?.type);
    // Logger.debug('Finish emitter stop method', this.state?.stop);
    this.state?.stop();
    // this.eventEmitter.emit('error');
    // this.eventEmitter.emit('finish');
  }

  download({ contentsId }: { contentsId: string }): Promise<Readable> {
    try {
      this.eventEmitter.emit('start');

      return new Promise((resolve, reject) => {
        this.state = this.fn(
          this.bucket,
          contentsId,
          {
            progressCallback: (progress: number) => {
              this.eventEmitter.emit('progress', progress);
            },
            finishedCallback: (err: Error, stream: Readable) => {
              logger.debug({ msg: '[FinishedCallback] Stream is ready' });

              if (err) {
                logger.debug({ msg: '[FinishedCallback] Stream has error', err });
                this.eventEmitter.emit('error', err);
                return reject(err);
              }

              this.eventEmitter.emit('finish');

              stream.on('close', () => {
                logger.debug({ msg: '[FinishedCallback] Stream closed' });
                this.removeListeners();
              });

              resolve(stream);
            },
          },
          {
            label: 'Dynamic',
            params: {
              useProxy: false,
              chunkSize: 4096 * 1024,
            },
          },
        );
      });
    } catch (exc) {
      logger.error({ msg: 'Error downloading file', exc });
      return Promise.reject(exc);
    }
  }

  on(event: keyof FileDownloadEvents, handler: FileDownloadEvents[keyof FileDownloadEvents]): void {
    this.eventEmitter.on(event, handler);
  }

  removeListeners(): void {
    this.eventEmitter.removeAllListeners();
  }
}
