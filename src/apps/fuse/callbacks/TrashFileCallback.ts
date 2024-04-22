import { Container } from 'diod';
import { AuxiliarOfflineContentsDeleter } from '../../../context/offline-drive/contents/application/auxiliar/AuxiliarOfflineContentsDeleter';
import { OfflineFileSearcher } from '../../../context/offline-drive/files/application/OfflineFileSearcher';
import { TemporalOfflineDeleter } from '../../../context/offline-drive/files/application/TemporalOfflineDeleter';
import { FileDeleter } from '../../../context/virtual-drive/files/application/FileDeleter';
import { FirstsFileSearcher } from '../../../context/virtual-drive/files/application/FirstsFileSearcher';
import { FileStatuses } from '../../../context/virtual-drive/files/domain/FileStatus';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseIOError, FuseNoSuchFileOrDirectoryError } from './FuseErrors';

export class TrashFileCallback extends NotifyFuseCallback {
  constructor(private readonly container: Container) {
    super('Trash file');
  }

  async execute(path: string) {
    const file = await this.container.get(FirstsFileSearcher).run({
      path,
      status: FileStatuses.EXISTS,
    });

    if (!file) {
      const offline = await this.container.get(OfflineFileSearcher).run({
        path,
      });

      if (!offline) {
        return this.left(new FuseNoSuchFileOrDirectoryError(path));
      }

      if (offline.isAuxiliary()) {
        await this.container.get(AuxiliarOfflineContentsDeleter).run(offline);
        await this.container.get(TemporalOfflineDeleter).run(offline);
      }

      return this.right();
    }

    try {
      await this.container.get(FileDeleter).run(file.contentsId);

      return this.right();
    } catch {
      return this.left(new FuseIOError());
    }
  }
}
