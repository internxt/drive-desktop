import { FileStatuses } from '../../../context/virtual-drive/files/domain/FileStatus';
import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseIOError, FuseNoSuchFileOrDirectoryError } from './FuseErrors';

export class TrashFileCallback extends NotifyFuseCallback {
  constructor(
    private readonly virtual: VirtualDriveDependencyContainer,
    private readonly offline: OfflineDriveDependencyContainer
  ) {
    super('Trash file');
  }

  async execute(path: string) {
    const file = await this.virtual.filesSearcher.run({
      path,
      status: FileStatuses.EXISTS,
    });

    if (!file) {
      const offline = await this.offline.offlineFileSearcher.run({
        path,
      });

      if (!offline) {
        return this.left(new FuseNoSuchFileOrDirectoryError(path));
      }

      if (offline.isAuxiliary()) {
        await this.offline.auxiliarOfflineContentsDeleter.run(offline);
        await this.offline.temporalOfflineDeleter.run(offline);
      }

      return this.right();
    }

    try {
      await this.virtual.fileDeleter.run(file.contentsId);

      return this.right();
    } catch {
      return this.left(new FuseIOError());
    }
  }
}
