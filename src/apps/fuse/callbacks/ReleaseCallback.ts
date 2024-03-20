import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';

export class ReleaseCallback extends NotifyFuseCallback {
  constructor(private readonly container: OfflineDriveDependencyContainer) {
    super('Release', { input: true });
  }

  async execute(path: string, _fd: number) {
    const uploadError = await this.container.offlineFileUploader.run(path);

    if (uploadError) {
      return this.left(uploadError);
    }

    return this.right();
  }
}
