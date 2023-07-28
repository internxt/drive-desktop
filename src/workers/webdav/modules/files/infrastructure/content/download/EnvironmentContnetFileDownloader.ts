import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core/download/strategy';
import { EventEmitter, Readable } from 'stream';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../../domain/ContentFileDownloader';
import { RemoteFileContents } from '../../../domain/RemoteFileContent';
import { WebdavFile } from '../../../domain/WebdavFile';
import { Stopwatch } from '../../../../../../../shared/types/Stopwatch';

export class EnvironmentContentFileDownloader implements ContentFileDownloader {
  private eventEmitter: EventEmitter;
  private stopwatch: Stopwatch;

  constructor(
    private readonly fn: DownloadStrategyFunction<unknown>,
    private readonly bucket: string
  ) {
    this.eventEmitter = new EventEmitter();
    this.stopwatch = new Stopwatch();
  }

  download(file: WebdavFile): Promise<Readable> {
    this.stopwatch.start();

    this.eventEmitter.emit('start');

    return new Promise((resolve, reject) => {
      this.fn(
        this.bucket,
        file.fileId,
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
            const remoteContents = RemoteFileContents.preview(file, stream);
            resolve(remoteContents.stream);
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
    event: keyof FileDownloadEvents,
    handler: FileDownloadEvents[keyof FileDownloadEvents]
  ): void {
    this.eventEmitter.on(event, handler);
  }

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
