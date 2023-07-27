import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core/upload/strategy';
import EventEmitter from 'events';
import { Stopwatch } from '../../../../../../shared/types/Stopwatch';
import { Readable } from 'stream';
import {
  ContentFileClonner,
  FileCloneEvents,
} from '../../domain/ContentFileClonner';
import { WebdavFile } from '../../domain/WebdavFile';

export class EnvironmentContentFileClonner implements ContentFileClonner {
  private readonly eventEmitter: EventEmitter;
  private stopwatch: Stopwatch;

  constructor(
    private readonly upload: UploadStrategyFunction,
    private readonly download: DownloadStrategyFunction<unknown>,
    private readonly bucket: string,
    private readonly file: WebdavFile
  ) {
    this.eventEmitter = new EventEmitter();
    this.stopwatch = new Stopwatch();
  }

  private downloadFile(): Promise<Readable> {
    this.eventEmitter.emit('start-download');
    this.stopwatch.start();
    return new Promise((resolve, reject) => {
      this.download(
        this.bucket,
        this.file.fileId,
        {
          progressCallback: (progress: number) => {
            this.eventEmitter.emit('download-progress', progress);
          },
          finishedCallback: async (err: Error, stream: Readable) => {
            if (err) {
              this.stopwatch.finish();
              this.eventEmitter.emit('error', err);
              return reject(err);
            }
            this.eventEmitter.emit('download-finished');
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

  private uploadFile(source: Readable, file: WebdavFile): Promise<string> {
    this.eventEmitter.emit('start-upload');
    return new Promise((resolve, reject) => {
      this.upload(this.bucket, {
        source,
        fileSize: file.size,
        finishedCallback: (err: Error | null, fileId: string) => {
          this.stopwatch.finish();
          if (err) {
            this.eventEmitter.emit('error', err);
            return reject(err);
          }
          this.eventEmitter.emit('upload-finished', fileId);
          resolve(fileId);
        },
        progressCallback: (progress: number) => {
          this.eventEmitter.emit('upload-progress', progress);
        },
      });
    });
  }

  async clone() {
    this.eventEmitter.emit('start');

    const file = await this.downloadFile();
    const fileId = await this.uploadFile(file, this.file);

    this.eventEmitter.emit('finish', fileId);

    return fileId;
  }

  on(
    event: keyof FileCloneEvents,
    handler: FileCloneEvents[keyof FileCloneEvents]
  ): void {
    this.eventEmitter.on(event, handler);
  }

  elapsedTime(): number {
    return this.stopwatch.elapsedTime();
  }
}
