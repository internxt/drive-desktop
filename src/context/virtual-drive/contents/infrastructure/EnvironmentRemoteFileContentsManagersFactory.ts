import { Environment } from '@internxt/inxt-js/build';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { EnvironmentContentFileDownloader } from './download/EnvironmentContentFileDownloader';

export class EnvironmentRemoteFileContentsManagersFactory {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  downloader() {
    return new EnvironmentContentFileDownloader(this.environment, this.bucket);
  }

  uploader() {
    return new EnvironmentFileUploader(this.environment, this.bucket);
  }
}
