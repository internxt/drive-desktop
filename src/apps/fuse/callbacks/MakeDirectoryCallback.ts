import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import { IOError } from './FuseErrors';

export class MakeDirectoryCallback extends NotifyFuseCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Make Directory');
  }

  async execute(path: string, _mode: number) {
    try {
      await this.container.folderSyncNotifier.creating(path);

      await this.container.folderCreator.run(path);

      await this.container.folderSyncNotifier.created(path);

      return this.right();
    } catch (err: unknown) {
      await this.container.folderSyncNotifier.error();

      return this.left(new IOError(path));
    }
  }
}
