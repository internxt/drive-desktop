import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseNoSuchFileOrDirectoryError } from './FuseErrors';
import { basename } from 'path';

export class TrashFolderCallback extends NotifyFuseCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Trash Folder');
  }

  async execute(path: string) {
    const folder = await this.container.folderSearcher.run({ path });

    if (!folder) {
      return this.left(new FuseNoSuchFileOrDirectoryError());
    }

    try {
      await this.container.folderDeleter.run(folder.uuid);

      return this.right();
    } catch (throwed: unknown) {
      const name = basename(path);

      this.container.syncFolderMessenger.errorWhileTrashing(name);

      return this.left(throwed);
    }
  }
}
