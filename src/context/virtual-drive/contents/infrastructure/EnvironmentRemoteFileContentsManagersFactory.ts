import { InxtJs } from '@/infra';
import { Environment } from '@internxt/inxt-js/build';

export class EnvironmentRemoteFileContentsManagersFactory {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  downloader() {
    return new InxtJs.ContentsDownloader(this.environment, this.bucket);
  }
}
