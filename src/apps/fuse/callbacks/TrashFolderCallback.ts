import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import { IOError, NoSuchFileOrDirectoryError } from './FuseErrors';

export class TrashFolderCallback extends NotifyFuseCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Trash Folder');
  }

  async execute(path: string) {
    const folder = await this.container.folderSearcher.run({ path });

    if (!folder) {
      return this.left(
        new NoSuchFileOrDirectoryError(
          `folder not found when trying to delete it ${path}`
        )
      );
    }

    try {
      await this.container.folderDeleter.run(folder.uuid);

      return this.right();
    } catch (err: unknown) {
      if (err instanceof Error) {
        return this.left(new IOError(`${err.message} when trashing ${path}`));
      }

      return this.left(
        new IOError(`error when trying to trash the folder ${path}: ${err}`)
      );
    }
  }
}
