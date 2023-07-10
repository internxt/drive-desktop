import { Environment } from '@internxt/inxt-js';
import { Readable } from 'stream';
import { FileSize } from '../../domain/FileSize';
import { RemoteFileContentsRepository } from '../../domain/RemoteFileContentsRepository';
import { WebdavFile } from '../../domain/WebdavFile';
import Logger from 'electron-log';
import { EnvironmentContentFileUpoader } from './EnvironmentContentFileUpoader';
import { EnvironmentContentFileDownloader } from './EnvironmentContnetFileDownloader';
import { ContentFileDownloader } from '../../domain/ContentFileDownloader';
import { ContentFileUploader } from '../../domain/ContentFileUploader';
import { EnvironmentContentFileClonner } from './EnvironmentContentFileClonner';
import { ContentFileClonner } from '../../domain/ContentFileClonner';

export class EnvironmentFileContentRepository
  implements RemoteFileContentsRepository
{
  private static MULTIPART_UPLOADE_SIZE_THRESHOLD = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  clonner(file: WebdavFile): ContentFileClonner {
    const uploadFunciton =
      file.size >
      EnvironmentFileContentRepository.MULTIPART_UPLOADE_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile
        : this.environment.upload;

    const clonner = new EnvironmentContentFileClonner(
      uploadFunciton,
      this.environment.download,
      this.bucket,
      file
    );

    return clonner;
  }

  downloader(file: WebdavFile): ContentFileDownloader {
    return new EnvironmentContentFileDownloader(
      this.environment.download,
      this.bucket,
      file
    );
  }

  uploader(size: FileSize, contents: Readable): ContentFileUploader {
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
