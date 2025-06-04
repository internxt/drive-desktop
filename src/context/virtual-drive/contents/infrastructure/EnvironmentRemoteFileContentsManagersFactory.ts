import { Environment } from '@internxt/inxt-js/build';
import { EnvironmentContentFileDownloader } from './download/EnvironmentContentFileDownloader';
import { EnvironmentContentFileUploader } from './upload/EnvironmentContentFileUploader';
import { LocalFileContents } from '../domain/LocalFileContents';

export class EnvironmentRemoteFileContentsManagersFactory {
  private static MULTIPART_UPLOAD_SIZE_THRESHOLD = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  downloader() {
    return new EnvironmentContentFileDownloader(this.environment.download, this.bucket);
  }

  uploader(contents: LocalFileContents, abortSignal: AbortSignal) {
    const fn =
      contents.size > EnvironmentRemoteFileContentsManagersFactory.MULTIPART_UPLOAD_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile.bind(this.environment)
        : this.environment.upload;

    return new EnvironmentContentFileUploader(fn, this.bucket, abortSignal);
  }
}
