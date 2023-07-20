import { Environment } from '@internxt/inxt-js';
import { FileSize } from '../../domain/FileSize';
import { RemoteFileContentsRepository } from '../../domain/RemoteFileContentsRepository';
import { WebdavFile } from '../../domain/WebdavFile';
import { EnvironmentContentFileUpoader } from './EnvironmentContentFileUpoader';
import { EnvironmentContentFileDownloader } from './EnvironmentContnetFileDownloader';
import { ContentFileDownloader } from '../../domain/ContentFileDownloader';
import { ContentFileUploader } from '../../domain/ContentFileUploader';
import { EnvironmentContentFileClonner } from './EnvironmentContentFileClonner';
import { ContentFileClonner } from '../../domain/ContentFileClonner';
import { RetryableFileUploader } from './RetryableFileUploader';

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

  uploader(size: FileSize): ContentFileUploader {
    const strategy =
      size.value >
      EnvironmentFileContentRepository.MULTIPART_UPLOADE_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile
        : this.environment.upload;

    const uploader = new EnvironmentContentFileUpoader(strategy, this.bucket);

    return new RetryableFileUploader(uploader);
  }
}
