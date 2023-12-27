import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { Callback } from './Callback';

export class CreateFolder {
  constructor(private readonly container: DependencyContainer) {}

  async execute(path: string, _mode: number, cb: Callback): Promise<void> {
    const offlineFolder = this.container.offline.offlineFolderCreator.run(path);

    await this.container.folderCreator.run(offlineFolder);

    cb(0);
  }
}
