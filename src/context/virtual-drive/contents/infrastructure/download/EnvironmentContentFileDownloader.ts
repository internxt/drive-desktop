import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core/download/strategy';
import { EventEmitter, Readable } from 'stream';
import { ContentFileDownloader, FileDownloadEvents } from '../../domain/contentHandlers/ContentFileDownloader';
import { File } from '../../../files/domain/File';
import { DownloadOneShardStrategy } from '@internxt/inxt-js/build/lib/core';
import { ActionState } from '@internxt/inxt-js/build/api';
import { Stopwatch } from '../../../../../apps/shared/types/Stopwatch';
import Logger from 'electron-log';
import { customInspect } from '@/apps/shared/logger/custom-inspect';

export class EnvironmentContentFileDownloader implements ContentFileDownloader {
  private eventEmitter: EventEmitter;
  private stopwatch: Stopwatch;

  private state: ActionState | null;

  constructor(
    private readonly fn: DownloadStrategyFunction<DownloadOneShardStrategy>,
    private readonly bucket: string,
  ) {
    this.eventEmitter = new EventEmitter();
    this.stopwatch = new Stopwatch();
    this.state = null;
  }

  forceStop(): void {
    // Logger.debug('Finish emitter type', this.state?.type);
    // Logger.debug('Finish emitter stop method', this.state?.stop);
    this.state?.stop();
    // this.eventEmitter.emit('error');
    // this.eventEmitter.emit('finish');
  }

  download(file: File): Promise<Readable> {
    try {
      this.stopwatch.start();

      this.eventEmitter.emit('start');

      return new Promise((resolve, reject) => {
        this.state = this.fn(
          this.bucket,
          file.contentsId,
          {
            progressCallback: (progress: number) => {
              this.eventEmitter.emit('progress', progress);
            },
            finishedCallback: async (err: Error, stream: Readable) => {
              Logger.debug('[FinishedCallback] Stream is ready', customInspect(err));
              this.stopwatch.finish();

              if (err) {
                this.eventEmitter.emit('error', err);
                return reject(err);
              }

              this.eventEmitter.emit('finish');

              stream.on('close', () => {
                Logger.debug('[FinishedCallback] Stream closed');
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
    } catch (error) {
      Logger.error('Error downloading file', customInspect(error));
      return Promise.reject(error);
    }
  }

  on(event: keyof FileDownloadEvents, handler: FileDownloadEvents[keyof FileDownloadEvents]): void {
    this.eventEmitter.on(event, handler);
  }

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }

  removeListeners(): void {
    this.eventEmitter.removeAllListeners();
  }
}
