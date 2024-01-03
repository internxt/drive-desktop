import Logger from 'electron-log';
import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';

export class CreateCallback extends NotifyFuseCallback {
  constructor(private readonly container: OfflineDriveDependencyContainer) {
    super();
  }

  async execute(path: string, _mode: number) {
    Logger.debug(`CREATE ${path}`);

    await this.container.offlineFileAndContentsCreator.run(path);

    return this.right();
  }
}
