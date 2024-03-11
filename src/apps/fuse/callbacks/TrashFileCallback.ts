import { FileStatuses } from '../../../context/virtual-drive/files/domain/FileStatus';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseIOError, FuseNoSuchFileOrDirectoryError } from './FuseErrors';

export class TrashFileCallback extends NotifyFuseCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Trash file');
  }

  async execute(path: string) {
    const file = await this.container.filesSearcher.run({
      path,
      status: FileStatuses.EXISTS,
    });

    if (!file) {
      return this.left(new FuseNoSuchFileOrDirectoryError());
    }

    try {
      await this.container.fileDeleter.run(file.contentsId);

      return this.right();
    } catch {
      return this.left(new FuseIOError());
    }
  }
}
