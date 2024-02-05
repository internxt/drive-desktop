import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core/download/strategy';
import { EventEmitter, Readable } from 'stream';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../domain/contentHandlers/ContentFileDownloader';
import { File } from '../../../files/domain/File';
import { DownloadOneShardStrategy } from '@internxt/inxt-js/build/lib/core';
import { Stopwatch } from '../../../../../apps/shared/types/Stopwatch';
import Logger from 'electron-log';

export class FuseEnvironmentContentFileDownloader
  implements ContentFileDownloader
{
  private eventEmitter: EventEmitter;
  private stopwatch: Stopwatch;

  constructor(
    private readonly fn: DownloadStrategyFunction<DownloadOneShardStrategy>,
    private readonly bucket: string
  ) {
    this.eventEmitter = new EventEmitter();
    this.stopwatch = new Stopwatch();
  }

  forceStop(): void {
    throw new Error('Method not implemented.');
  }

  download(file: File): Promise<Readable> {
    this.stopwatch.start();

    this.eventEmitter.emit('start');

    return new Promise((resolve, reject) => {
      this.fn(
        this.bucket,
        file.contentsId,
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
    });
  }

  on(
    event: keyof FileDownloadEvents,
    handler: FileDownloadEvents[keyof FileDownloadEvents]
  ): void {
    this.eventEmitter.on(event, handler);
  }

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
