import { Container } from 'diod';
import { TemporalFileByPathFinder } from '../../../../context/offline-drive/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFileUploader } from '../../../../context/offline-drive/TemporalFiles/application/upload/TemporalFileUploader';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseIOError } from './FuseErrors';
import Logger from 'electron-log';
import { LocalFileCacheDeleter } from '../../../../context/offline-drive/LocalFile/application/delete/LocalFileCacheDeleter';

export class ReleaseCallback extends NotifyFuseCallback {
  constructor(private readonly container: Container) {
    super('Release', { debug: false });
  }

  async execute(path: string, _fd: number) {
    try {
      const document = await this.container
        .get(TemporalFileByPathFinder)
        .run(path);

      if (document) {
        this.logDebugMessage('Offline File found');
        if (document.size.value === 0) {
          this.logDebugMessage('Offline File Size is 0');
          return this.right();
        }

        if (document.isAuxiliary()) {
          this.logDebugMessage('Offline File is Auxiliary');
          return this.right();
        }

        await this.container.get(TemporalFileUploader).run(document.path.value);
        this.logDebugMessage('Offline File has been uploaded');
        return this.right();
      }

      const virtualFile = await this.container.get(FirstsFileSearcher).run({
        path,
      });

      if (virtualFile) {
        await this.container
          .get(LocalFileCacheDeleter)
          .run(virtualFile.contentsId);

        this.logDebugMessage(
          `${virtualFile.path} removed from local file cache`
        );

        return this.right();
      }

      this.logDebugMessage(`File with ${path} not found`);
      return this.right();
    } catch (err: unknown) {
      Logger.error(err);
      return this.left(new FuseIOError());
    }
  }
}
