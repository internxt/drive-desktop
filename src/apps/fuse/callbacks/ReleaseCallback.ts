import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import Logger from 'electron-log';
import { FuseIOError } from './FuseErrors';

export class ReleaseCallback extends NotifyFuseCallback {
  constructor(
    private readonly offlineDrive: OfflineDriveDependencyContainer,
    private readonly virtualDrive: VirtualDriveDependencyContainer
  ) {
    super('Release');
  }

  async execute(path: string, _fd: number) {
    try {
      const offlineFile = await this.offlineDrive.offlineFileSearcher.run({
        path,
      });

      if (offlineFile) {
        if (offlineFile.size.value === 0) {
          return this.right();
        }

        if (offlineFile.isAuxiliary()) {
          return this.right();
        }

        await this.offlineDrive.offlineContentsUploader.run(
          offlineFile.id,
          offlineFile.path
        );
        return this.right();
      }

      const virtualFile = await this.virtualDrive.filesSearcher.run({ path });

      if (virtualFile) {
        const contentsPath =
          this.virtualDrive.relativePathToAbsoluteConverter.run(
            virtualFile.contentsId
          );

        await this.offlineDrive.offlineContentsCacheCleaner.run(contentsPath);

        return this.right();
      }

      return this.right();
    } catch (err: unknown) {
      Logger.error('RELEASE', err);
      return this.left(new FuseIOError());
    }
  }
}
