import { Environment } from '@internxt/inxt-js';
import { FileSize } from '../../domain/FileSize';
import { RemoteFileContentsManagersFactory } from '../../domain/RemoteFileContentsManagersFactory';
import { WebdavFile } from '../../domain/WebdavFile';
import { EnvironmentContentFileUpoader } from './upload/EnvironmentContentFileUpoader';
import { EnvironmentContentFileDownloader } from './download/EnvironmentContnetFileDownloader';
import { ContentFileDownloader } from '../../domain/ContentFileDownloader';
import { ContentFileUploader } from '../../domain/ContentFileUploader';
import { EnvironmentContentFileClonner } from './EnvironmentContentFileClonner';
import { ContentFileClonner } from '../../domain/ContentFileClonner';

export class EnvironmentRemoteFileContentsManagersFactory
  implements RemoteFileContentsManagersFactory
{
  private static MULTIPART_UPLOADE_SIZE_THRESHOLD = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  clonner(file: WebdavFile): ContentFileClonner {
    const uploadFunciton =
      file.size >
      EnvironmentRemoteFileContentsManagersFactory.MULTIPART_UPLOADE_SIZE_THRESHOLD
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

  downloader(): ContentFileDownloader {
    return new EnvironmentContentFileDownloader(
      this.environment.download,
      this.bucket
    );
  }

  uploader(size: FileSize): ContentFileUploader {
    const fn =
      size.value >
      EnvironmentRemoteFileContentsManagersFactory.MULTIPART_UPLOADE_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile
        : this.environment.upload;

    return new EnvironmentContentFileUpoader(fn, this.bucket);
  }
}
