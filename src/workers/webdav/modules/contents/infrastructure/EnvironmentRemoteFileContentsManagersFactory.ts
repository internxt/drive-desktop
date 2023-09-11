import { Environment } from '@internxt/inxt-js';
import { ContentFileClonner } from '../domain/contentHandlers/ContentFileClonner';
import { ContentFileDownloader } from '../domain/contentHandlers/ContentFileDownloader';
import { ContentFileUploader } from '../domain/contentHandlers/ContentFileUploader';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { EnvironmentContentFileDownloader } from './download/EnvironmentContnetFileDownloader';
import { EnvironmentContentFileClonner } from './EnvironmentContentFileClonner';
import { EnvironmentContentFileUpoader } from './upload/EnvironmentContentFileUpoader';
import { File } from '../../files/domain/File';
import { LocalFileContents } from '../domain/LocalFileContents';

export class EnvironmentRemoteFileContentsManagersFactory
  implements ContentsManagersFactory
{
  private static MULTIPART_UPLOADE_SIZE_THRESHOLD = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  clonner(file: File): ContentFileClonner {
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

  uploader(
    contents: LocalFileContents,
    abortSignal?: AbortSignal
  ): ContentFileUploader {
    contents.size;
    const fn =
      contents.size >
      EnvironmentRemoteFileContentsManagersFactory.MULTIPART_UPLOADE_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile
        : this.environment.upload;

    return new EnvironmentContentFileUpoader(fn, this.bucket, abortSignal);
  }
}
