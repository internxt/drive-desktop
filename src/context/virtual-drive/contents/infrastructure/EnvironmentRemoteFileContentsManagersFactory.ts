import { Environment } from '@internxt/inxt-js';
import { Service } from 'diod';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { LocalFileContents } from '../domain/LocalFileContents';
import { ContentFileDownloader } from '../domain/contentHandlers/ContentFileDownloader';
import { ContentFileUploader } from '../domain/contentHandlers/ContentFileUploader';
import { EnvironmentContentFileDownloader } from './download/EnvironmentContentFileDownloader';
import { FuseEnvironmentContentFileDownloader } from './download/FuseEnvironmentContentFileDownloader';
import { EnvironmentContentFileUploader } from './upload/EnvironmentContentFileUploader';

@Service()
export class EnvironmentRemoteFileContentsManagersFactory
  implements ContentsManagersFactory
{
  private static MULTIPART_UPLOAD_SIZE_THRESHOLD = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  downloader(): ContentFileDownloader {
    if (process.platform === 'linux') {
      return new FuseEnvironmentContentFileDownloader(
        this.environment.download,
        this.bucket
      );
    }

    return new EnvironmentContentFileDownloader(
      this.environment.download,
      this.bucket
    );
  }

  uploader(
    contents: LocalFileContents,
    abortSignal?: AbortSignal
  ): ContentFileUploader {
    contents.size;
    const fn =
      contents.size >
      EnvironmentRemoteFileContentsManagersFactory.MULTIPART_UPLOAD_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile.bind(this.environment)
        : this.environment.upload;

    return new EnvironmentContentFileUploader(fn, this.bucket, abortSignal);
  }
}
