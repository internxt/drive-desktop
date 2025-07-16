import { Environment } from '@internxt/inxt-js/build';
import { EnvironmentContentFileDownloader } from './download/EnvironmentContentFileDownloader';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';

export class EnvironmentRemoteFileContentsManagersFactory {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  downloader() {
    return new EnvironmentContentFileDownloader(this.environment.download, this.bucket);
  }

  uploader() {
    return new EnvironmentFileUploader(this.environment, this.bucket);
  }
}
