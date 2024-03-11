import { FolderStatuses } from '../../../context/virtual-drive/folders/domain/FolderStatus';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import { basename } from 'path';

export class TrashFolderCallback extends NotifyFuseCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Trash Folder');
  }

  async execute(path: string) {
    try {
      const folder = await this.container.singleFolderMatchingFinder.run({
        path,
        status: FolderStatuses.EXISTS,
      });

      await this.container.folderDeleter.run(folder.uuid);

      return this.right();
    } catch (throwed: unknown) {
      await this.container.syncFolderMessenger.issue({
        error: 'FOLDER_TRASH_ERROR',
        cause: 'UNKNOWN',
        name: basename(path),
      });

      return this.left(throwed);
    }
  }
}
