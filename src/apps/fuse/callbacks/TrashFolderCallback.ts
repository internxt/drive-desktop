import { Container } from 'diod';
import { basename } from 'path';
import { FolderDeleter } from '../../../context/virtual-drive/folders/application/FolderDeleter';
import { SingleFolderMatchingFinder } from '../../../context/virtual-drive/folders/application/SingleFolderMatchingFinder';
import { FolderStatuses } from '../../../context/virtual-drive/folders/domain/FolderStatus';
import { SyncFolderMessenger } from '../../../context/virtual-drive/folders/domain/SyncFolderMessenger';
import { NotifyFuseCallback } from './FuseCallback';

export class TrashFolderCallback extends NotifyFuseCallback {
  constructor(private readonly container: Container) {
    super('Trash Folder');
  }

  async execute(path: string) {
    try {
      const folder = await this.container.get(SingleFolderMatchingFinder).run({
        path,
        status: FolderStatuses.EXISTS,
      });

      await this.container.get(FolderDeleter).run(folder.uuid);

      return this.right();
    } catch (throwed: unknown) {
      await this.container.get(SyncFolderMessenger).issue({
        error: 'FOLDER_TRASH_ERROR',
        cause: 'UNKNOWN',
        name: basename(path),
      });

      return this.left(throwed);
    }
  }
}
