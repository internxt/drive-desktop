import { Environment } from '@internxt/inxt-js';
import { Readable } from 'stream';
import { FileSize } from '../../domain/FileSize';
import { RemoteFileContentsRepository } from '../../domain/RemoteFileContentsRepository';
import { WebdavFile } from '../../domain/WebdavFile';
import { RemoteFileContents } from '../../domain/RemoteFileContent';
import Logger from 'electron-log';
import { ipcRenderer } from 'electron';
import { EnvironmentContentFileUpoader } from './EnvironmentContentFileUpoader';

export class EnvironmentFileContentRepository
  implements RemoteFileContentsRepository
{
  private static MULTIPART_UPLOADE_SIZE_THRESHOLD = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  clonner(file: WebdavFile): EnvironmentContentFileUpoader {
    const remoteFileContents = this.downloader(file);

    const fn =
      file.size >
      EnvironmentFileContentRepository.MULTIPART_UPLOADE_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile
        : this.environment.upload;

    return new EnvironmentContentFileUpoader(
      fn,
      this.bucket,
      file.size,
      remoteFileContents
    );
  }

  downloader(file: WebdavFile): Promise<Readable> {
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

  uploader(size: FileSize, contents: Readable): EnvironmentContentFileUpoader {
    const fn =
      size.value >
      EnvironmentFileContentRepository.MULTIPART_UPLOADE_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile
        : this.environment.upload;

    return new EnvironmentContentFileUpoader(
      fn,
      this.bucket,
      size.value,
      Promise.resolve(contents)
    );
  }
}
