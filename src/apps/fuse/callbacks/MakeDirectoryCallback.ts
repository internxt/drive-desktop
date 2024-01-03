import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';

export class MakeDirectoryCallback extends NotifyFuseCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Make Directory');
  }

  async execute(path: string, _mode: number) {
    const offlineFolder = this.container.offline.offlineFolderCreator.run(path);

    await this.container.folderCreator.run(offlineFolder);

    return this.right();
  }
}
