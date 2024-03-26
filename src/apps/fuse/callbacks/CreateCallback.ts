import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';

export class CreateCallback extends NotifyFuseCallback {
  constructor(private readonly container: OfflineDriveDependencyContainer) {
    super('Create', { input: true, output: true });
  }

  async execute(path: string, _mode: number) {
    await this.container.offlineFileAndContentsCreator.run(path);

    return this.right();
  }
}
