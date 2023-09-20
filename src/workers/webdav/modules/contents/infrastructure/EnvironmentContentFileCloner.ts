import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core/upload/strategy';
import EventEmitter from 'events';
import { Readable } from 'stream';
import { Stopwatch } from '../../../../../shared/types/Stopwatch';
import {
  ContentFileCloner,
  FileCloneEvents,
} from '../domain/contentHandlers/ContentFileCloner';
import { File } from '../../files/domain/File';
import { ContentsId } from '../domain/ContentsId';

export class EnvironmentContentFileCloner implements ContentFileCloner {
  private readonly eventEmitter: EventEmitter;
  private stopwatch: Stopwatch;

  constructor(
    private readonly upload: UploadStrategyFunction,
    private readonly download: DownloadStrategyFunction<unknown>,
    private readonly bucket: string,
    private readonly file: File
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
        this.file.contentsId,
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

  private uploadFile(source: Readable, file: File): Promise<string> {
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

    const stream = await this.downloadFile();
    const id = await this.uploadFile(stream, this.file);

    const contentsId = new ContentsId(id);

    this.eventEmitter.emit('finish', contentsId);

    return contentsId;
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
