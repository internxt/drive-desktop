import { Environment } from '@internxt/inxt-js';
import { Readable } from 'stream';
import { FileSize } from '../../domain/FileSize';
import { RemoteFileContentsRepository } from '../../domain/FileContentRepository';
import { WebdavFile } from '../../domain/WebdavFile';
import { RemoteFileContents } from '../../domain/RemoteFileContent';

export class EnvironmentFileContentRepository
  implements RemoteFileContentsRepository
{
  private static MULTIPART_UPLOADE_SIZE_THRESHOLD = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  private simpleUpload(size: FileSize, contents: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      this.environment.upload(this.bucket, {
        finishedCallback: async (err: unknown, fileId: string) => {
          if (!err) {
            resolve(fileId);
          } else {
            reject();
          }
        },
        fileSize: size.value,
        source: contents,
      });
    });
  }

  private multipartUpload(size: FileSize, contents: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      this.environment.uploadMultipartFile(this.bucket, {
        progressCallback: (_progress: number) => {
          //
        },
        finishedCallback: async (err: unknown, fileId: string | null) => {
          if (err) {
            contents.destroy(new Error('MULTIPART UPLOAD FAILED'));
            reject();
          }

          if (!fileId) {
            reject();
            return;
          }

          resolve(fileId);
        },
        fileSize: size.value,
        source: contents,
      });
    });
  }

  async clone(file: WebdavFile): Promise<string> {
    const remoteFileContents = await this.download(file);

    return this.upload(file.size, remoteFileContents.contents);
  }

  download(file: WebdavFile): Promise<RemoteFileContents> {
    return new Promise((resolve, reject) => {
      this.environment.download(
        this.bucket,
        file.fileId,
        {
          finishedCallback: async (err: unknown, stream: Readable) => {
            if (err) {
              reject(err);
            } else {
              const remoteContents = RemoteFileContents.retrive(file, stream);
              resolve(remoteContents);
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

  upload(size: FileSize, contents: Readable): Promise<string> {
    return size.value >
      EnvironmentFileContentRepository.MULTIPART_UPLOADE_SIZE_THRESHOLD
      ? this.multipartUpload(size, contents)
      : this.simpleUpload(size, contents);
  }
}
