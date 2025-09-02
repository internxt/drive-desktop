import { Environment } from '@internxt/inxt-js/build';
import { EnvironmentContentFileDownloader } from './download/EnvironmentContentFileDownloader';

export class EnvironmentRemoteFileContentsManagersFactory {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  downloader() {
    return new EnvironmentContentFileDownloader(this.environment, this.bucket);
  }
}
