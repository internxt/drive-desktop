import { Environment } from '@internxt/inxt-js';
import { Readable } from 'stream';
import { FileContentRepository } from '../../domain/storage/FileContentRepository';
import { WebdavFile } from '../../domain/WebdavFile';

export class EnvironmentFileContentRepository implements FileContentRepository {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  async clone(file: WebdavFile): Promise<string> {
    const contents = await this.download(file.fileId);

    return this.upload(file.size, contents);
  }

  download(fileId: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
      this.environment.download(
        this.bucket,
        fileId,
        {
          finishedCallback: async (err: unknown, stream: Readable) => {
            if (err) {
              reject(err);
            } else {
              resolve(stream);
            }
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

  upload(size: number, contents: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      this.environment.upload(this.bucket, {
        finishedCallback: async (err: unknown, fileId: string) => {
          if (!err) {
            resolve(fileId);
          } else {
            reject();
          }
        },
        fileSize: size,
        source: contents,
      });
    });
  }
}
