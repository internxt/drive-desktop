import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core/download/strategy';
import { EventEmitter, Readable } from 'stream';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../domain/contentHandlers/ContentFileDownloader';
import { File } from '../../../files/domain/File';
import { DownloadOneShardStrategy } from '@internxt/inxt-js/build/lib/core';
import { ActionState } from '@internxt/inxt-js/build/api';
import { Stopwatch } from '../../../../../apps/shared/types/Stopwatch';

export class FuseEnvironmentContentFileDownloader
  implements ContentFileDownloader
{
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

  download(file: File): Promise<Readable> {
    this.stopwatch.start();

    this.eventEmitter.emit('start');

    return new Promise((resolve, reject) => {
      this.state = this.fn(
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
    this.eventEmitter.on('finish', () => {
      this.eventEmitter.removeAllListeners();
    });
  }

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
