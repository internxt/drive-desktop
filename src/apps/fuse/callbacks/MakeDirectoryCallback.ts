import { basename } from 'path';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';

export class MakeDirectoryCallback extends NotifyFuseCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Make Directory');
  }

  async execute(path: string, _mode: number) {
    try {
      await this.container.syncFolderMessenger.creating(path);

      await this.container.folderCreator.run(path);

      await this.container.syncFolderMessenger.created(path);

      return this.right();
    } catch (throwed: unknown) {
      await this.container.syncFolderMessenger.error({
        error: 'FOLDER_CREATE_ERROR',
        cause: 'UNKNOWN',
        name: basename(path),
      });

      return this.left(throwed);
    }
  }
}
