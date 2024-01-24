import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';

export class ReleaseCallback extends NotifyFuseCallback {
  constructor(private readonly container: OfflineDriveDependencyContainer) {
    super('Release');
  }

  async execute(path: string, _fd: number) {
    const file = await this.container.offlineFileSearcher.run({ path });

    if (!file) {
      return this.right();
    }

    await this.container.offlineFileUploader.run(file);
    return this.right();
  }
}
