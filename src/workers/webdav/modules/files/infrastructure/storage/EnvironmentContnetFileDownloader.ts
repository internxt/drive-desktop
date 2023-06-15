import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core/download/strategy';
import { EventEmitter, Readable } from 'stream';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../domain/ContentFileDownloader';
import { RemoteFileContents } from '../../domain/RemoteFileContent';
import { WebdavFile } from '../../domain/WebdavFile';

export class EnvironmentContentFileDownloader implements ContentFileDownloader {
  private eventEmitter: EventEmitter;

  constructor(
    private readonly fn: DownloadStrategyFunction<unknown>,
    private readonly bucket: string,
    private readonly file: WebdavFile
  ) {
    this.eventEmitter = new EventEmitter();
  }

  download(): Promise<Readable> {
    this.eventEmitter.emit('start');
    return new Promise((resolve, reject) => {
      this.fn(
        this.bucket,
        this.file.fileId,
        {
          progressCallback: (progress: number) => {
            this.eventEmitter.emit('progress', progress);
          },
          finishedCallback: async (err: Error, stream: Readable) => {
            if (err) {
              this.eventEmitter.emit('error', err);
              return reject(err);
            }
            this.eventEmitter.emit('finish');
            const remoteContents = RemoteFileContents.preview(
              this.file,
              stream
            );
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
}
