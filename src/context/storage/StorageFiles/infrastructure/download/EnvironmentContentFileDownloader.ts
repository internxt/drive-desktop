import { ActionState } from '@internxt/inxt-js/build/api';
import { DownloadOneShardStrategy } from '@internxt/inxt-js/build/lib/core';
import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core/download/strategy';
import { EventEmitter, Readable } from 'stream';
import { Stopwatch } from '../../../../../apps/shared/types/Stopwatch';
import { StorageFile } from '../../domain/StorageFile';
import {
  DownloadEvents,
  DownloaderHandler,
} from '../../domain/download/DownloaderHandler';
import Logger from 'electron-log';

export class EnvironmentContentFileDownloader implements DownloaderHandler {
  private eventEmitter: EventEmitter;
  private stopwatch: Stopwatch;

  private state: ActionState | null;

  constructor(
    private readonly fn: DownloadStrategyFunction<DownloadOneShardStrategy>,
    private readonly bucket: string
  ) {
    this.eventEmitter = new EventEmitter();
    this.stopwatch = new Stopwatch();
    this.state = null;
  }

  forceStop(): void {
    //@ts-ignore
    // Logger.debug('Finish emitter type', this.state?.type);
    // Logger.debug('Finish emitter stop method', this.state?.stop);
    this.state?.stop();
    // this.eventEmitter.emit('error');
    // this.eventEmitter.emit('finish');
  }

  download(file: StorageFile): Promise<Readable> {
    return this.executeDownload(file.id.value);
  }

  downloadById(fileId: string): Promise<Readable> {
    return this.executeDownload(fileId);
  }

  private executeDownload(fileId: string): Promise<Readable> {
    this.stopwatch.start();
    this.eventEmitter.emit('start');
    return new Promise((resolve, reject) => {
      try {
        this.state = this.fn(
          this.bucket,
          fileId,
          {
            progressCallback: (progress: number) => {
              this.eventEmitter.emit('progress', progress, this.elapsedTime());
            },
            finishedCallback: async (err: Error, stream: Readable) => {
              this.stopwatch.finish();

              if (err) {
                this.eventEmitter.emit('error', err);
                return reject(err);
              }
              this.eventEmitter.emit('finish', this.elapsedTime());

              resolve(stream);
            },
          },
          {
            label: 'Dynamic',
            params: {
              useProxy: false,
              chunkSize: 4096 * 1024,
            },
          }
        );
      } catch (err) {
        Logger.error('Error in downloader:', err);
        this.eventEmitter.emit('error', err);
        return reject(err);
      }
    });
  }

  on(
    event: keyof DownloadEvents,
    handler: DownloadEvents[keyof DownloadEvents]
  ): void {
    this.eventEmitter.on(event, handler);
    this.eventEmitter.on('finish', () => {
      this.eventEmitter.removeAllListeners();
    });
  }

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
