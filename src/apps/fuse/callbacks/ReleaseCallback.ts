import { Container } from 'diod';
import Logger from 'electron-log';
import { OfflineContentsCacheCleaner } from '../../../context/offline-drive/contents/application/OfflineContentsCacheCleaner';
import { OfflineContentsUploader } from '../../../context/offline-drive/contents/application/OfflineContentsUploader';
import { OfflineFileSearcher } from '../../../context/offline-drive/files/application/OfflineFileSearcher';
import { FirstsFileSearcher } from '../../../context/virtual-drive/files/application/FirstsFileSearcher';
import { RelativePathToAbsoluteConverter } from '../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseIOError } from './FuseErrors';

export class ReleaseCallback extends NotifyFuseCallback {
  constructor(private readonly container: Container) {
    super('Release');
  }

  async execute(path: string, _fd: number) {
    try {
      const offlineFile = await this.container.get(OfflineFileSearcher).run({
        path,
      });

      if (offlineFile) {
        this.logDebugMessage('Offline File found');
        if (offlineFile.size.value === 0) {
          this.logDebugMessage('Offline File Size is 0');
          return this.right();
        }

        if (offlineFile.isAuxiliary()) {
          this.logDebugMessage('Offline File is Auxiliary');
          return this.right();
        }

        await this.container
          .get(OfflineContentsUploader)
          .run(offlineFile.id, offlineFile.path);
        this.logDebugMessage('Offline File has been uploaded');
        return this.right();
      }

      const virtualFile = await this.container.get(FirstsFileSearcher).run({
        path,
      });

      if (virtualFile) {
        this.logDebugMessage('Virtual File has been uploaded');
        const contentsPath = this.container
          .get(RelativePathToAbsoluteConverter)
          .run(virtualFile.contentsId);

        await this.container.get(OfflineContentsCacheCleaner).run(contentsPath);

        return this.right();
      }

      this.logDebugMessage(`File with ${path} not found`);
      return this.right();
    } catch (err: unknown) {
      Logger.error('RELEASE', err);
      return this.left(new FuseIOError());
    }
  }
}
