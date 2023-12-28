import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { Callback } from './Callback';

export class ReleaseCallback {
  constructor(private readonly container: OfflineDriveDependencyContainer) {}

  async execute(path: string, _fd: number, cb: Callback): Promise<void> {
    await this.container.offlineContentsUploader.run(path);

    cb(0);
  }
}
