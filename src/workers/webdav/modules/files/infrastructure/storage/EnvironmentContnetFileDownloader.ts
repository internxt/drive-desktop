import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core/download/strategy';
import { Readable } from 'stream';
import {
  ContentFileDownloader,
  FileDownloadEvents,
} from '../../domain/ContentFileDownloader';
import { RemoteFileContents } from '../../domain/RemoteFileContent';
import { WebdavFile } from '../../domain/WebdavFile';
import { Stopwatch } from '../../../../../../shared/types/Stopwatch';
import { FileActionEventEmitter } from './FileActionEventEmitter';

export class EnvironmentContentFileDownloader
  extends FileActionEventEmitter<FileDownloadEvents>
  implements ContentFileDownloader
{
  private stopwatch: Stopwatch;

  constructor(
    private readonly fn: DownloadStrategyFunction<unknown>,
    private readonly bucket: string,
    private readonly file: WebdavFile
  ) {
    super();
    this.stopwatch = new Stopwatch();
  }

  download(): Promise<Readable> {
    this.stopwatch.start();

    this.emit('start');

    return new Promise((resolve, reject) => {
      this.fn(
        this.bucket,
        this.file.fileId,
        {
          progressCallback: (progress: number) => {
            this.emit('progress', progress);
          },
          finishedCallback: async (err: Error, stream: Readable) => {
            this.stopwatch.finish();

            if (err) {
              this.emit('error', err);
              return reject(err);
            }
            this.emit('finish');
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

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
