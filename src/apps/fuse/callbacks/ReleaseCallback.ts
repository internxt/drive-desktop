import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { Callback } from './Callback';

export class ReleaseCallback {
  constructor(private readonly container: OfflineDriveDependencyContainer) {}

  async execute(path: string, _fd: number, cb: Callback): Promise<void> {
    const file = await this.container.offlineFileSearcher.run({ path });

    if (!file) {
      return cb(0);
    }

    await this.container.offlineFileUploader.run(file);

    cb(0);
  }
}
