import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { Callback } from './Callback';

export class CreateFolder {
  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  async execute(path: string, _mode: number, cb: Callback): Promise<void> {
    const offlineFolder = this.container.offline.offlineFolderCreator.run(path);

    await this.container.folderCreator.run(offlineFolder);

    cb(0);
  }
}
