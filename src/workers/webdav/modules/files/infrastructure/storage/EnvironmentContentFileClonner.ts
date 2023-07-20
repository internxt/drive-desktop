import { DownloadStrategyFunction } from '@internxt/inxt-js/build/lib/core';
import { UploadStrategyFunction } from '@internxt/inxt-js/build/lib/core/upload/strategy';
import { Readable } from 'stream';
import {
  ContentFileClonner,
  FileCloneEvents,
} from '../../domain/ContentFileClonner';
import { WebdavFile } from '../../domain/WebdavFile';
import { FileActionEventEmitter } from './FileActionEventEmitter';

export class EnvironmentContentFileClonner
  extends FileActionEventEmitter<FileCloneEvents>
  implements ContentFileClonner
{
  constructor(
    private readonly upload: UploadStrategyFunction,
    private readonly download: DownloadStrategyFunction<unknown>,
    private readonly bucket: string,
    private readonly file: WebdavFile
  ) {
    super();
  }

  private downloadFile(): Promise<Readable> {
    this.emit('start-download');

    return new Promise((resolve, reject) => {
      this.download(
        this.bucket,
        this.file.fileId,
        {
          progressCallback: (progress: number) => {
            this.emit('download-progress', progress);
          },
          finishedCallback: async (err: Error, stream: Readable) => {
            if (err) {
              this.emit('error', err);
              return reject(err);
            }
            this.emit('download-finished');
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
    this.emit('start-upload');

    return new Promise((resolve, reject) => {
      this.upload(this.bucket, {
        source,
        fileSize: file.size,
        finishedCallback: (err: Error | null, fileId: string) => {
          if (err) {
            this.emit('error', err);
            return reject(err);
          }
          this.emit('upload-finished', fileId);
          resolve(fileId);
        },
        progressCallback: (progress: number) => {
          this.emit('upload-progress', progress);
        },
      });
    });
  }

  async clone() {
    this.emit('start');

    const file = await this.downloadFile();
    const fileId = await this.uploadFile(file, this.file);

    this.emit('finish');

    return fileId;
  }
}
