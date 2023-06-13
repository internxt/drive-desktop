import { Environment } from '@internxt/inxt-js';
import { Readable } from 'stream';
import { FileSize } from '../../domain/FileSize';
import { RemoteFileContentsRepository } from '../../domain/RemoteFileContentsRepository';
import { WebdavFile } from '../../domain/WebdavFile';
import { RemoteFileContents } from '../../domain/RemoteFileContent';
import Logger from 'electron-log';
import { ipcRenderer } from 'electron';

export class EnvironmentFileContentRepository
  implements RemoteFileContentsRepository
{
  private static MULTIPART_UPLOADE_SIZE_THRESHOLD = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  private simpleUpload(name: string, size: FileSize, contents: Readable): Promise<string> {
    Logger.log('download!!', { name });
    return new Promise((resolve, reject) => {
      this.environment.upload(this.bucket, {
        progressCallback: (progress: number) => {
          ipcRenderer.send('SYNC_INFO_UPDATE', {
            action: 'PULL',
            kind: 'REMOTE',
            progress,
            name,
          });
        },
        finishedCallback: async (err: Error, fileId: string) => {
          if (!err) {
            ipcRenderer.send('SYNC_INFO_UPDATE', {
              action: 'PULLED',
              kind: 'REMOTE',
              name,
            });
            resolve(fileId);
          } else {
            ipcRenderer.send('SYNC_INFO_UPDATE', {
              action: 'PULL_ERROR',
              kind: 'REMOTE',
              name,
              errorName: err.name,
              errorDetails: err.message,
              process: 'SYNC',
            });
            reject();
          }
        },
        fileSize: size.value,
        source: contents,
      });
    });
  }

  private multipartUpload(name: string, size: FileSize, contents: Readable): Promise<string> {
    Logger.log('download!!', { name });
    return new Promise((resolve, reject) => {
      this.environment.uploadMultipartFile(this.bucket, {
        progressCallback: (progress: number) => {
          ipcRenderer.send('SYNC_INFO_UPDATE', {
            action: 'PULL',
            kind: 'REMOTE',
            progress,
            name,
          });
        },
        finishedCallback: async (err: Error | null, fileId: string | null) => {
          if (err) {
            contents.destroy(new Error('MULTIPART UPLOAD FAILED'));
            ipcRenderer.send('SYNC_INFO_UPDATE', {
              action: 'PULL_ERROR',
              kind: 'REMOTE',
              name,
              errorName: err.name,
              errorDetails: err.message,
              process: 'SYNC',
            });
            reject();
          } else if (!fileId) {
            ipcRenderer.send('SYNC_INFO_UPDATE', {
              action: 'PULL_ERROR',
              kind: 'REMOTE',
              name,
              errorName: 'No fileId',
              errorDetails: 'No fileId on multipart upload',
              process: 'SYNC',
            });
            reject();
          } else {
            ipcRenderer.send('SYNC_INFO_UPDATE', {
              action: 'PULLED',
              kind: 'REMOTE',
              name,
            });
            resolve(fileId);
          }
        },
        fileSize: size.value,
        source: contents,
      });
    });
  }

  async clone(file: WebdavFile): Promise<string> {
    const remoteFileContents = await this.download(file);

    return this.upload(file.nameWithExtension, file.size, remoteFileContents);
  }

  download(file: WebdavFile): Promise<Readable> {
    Logger.log('download!!', { name: file.nameWithExtension });
    return new Promise((resolve, reject) => {
      this.environment.download(
        this.bucket,
        file.fileId,
        {
          progressCallback: (progress: number) => {
            ipcRenderer.send('SYNC_INFO_UPDATE', {
              action: 'PULL',
              kind: 'LOCAL',
              progress,
              name: file.nameWithExtension,
            });
          },
          finishedCallback: async (err: Error, stream: Readable) => {
            if (err) {
              ipcRenderer.send('SYNC_INFO_UPDATE', {
                action: 'PULL_ERROR',
                kind: 'LOCAL',
                name: file.nameWithExtension,
                errorName: err.name,
                errorDetails: err.message,
                process: 'SYNC',
              });
              reject(err);
            } else {
              ipcRenderer.send('SYNC_INFO_UPDATE', {
                action: 'PULLED',
                kind: 'LOCAL',
                name: file.nameWithExtension,
              });
              const remoteContents = RemoteFileContents.preview(file, stream);
              resolve(remoteContents.stream);
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

  upload(name: string, size: FileSize, contents: Readable): Promise<string> {
    return size.value >
      EnvironmentFileContentRepository.MULTIPART_UPLOADE_SIZE_THRESHOLD
      ? this.multipartUpload(name, size, contents)
      : this.simpleUpload(name, size, contents);
  }
}
