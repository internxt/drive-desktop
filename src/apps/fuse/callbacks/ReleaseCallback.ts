import { basename, extname } from 'path';
import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import Logger from 'electron-log';

export class ReleaseCallback extends NotifyFuseCallback {
  constructor(
    private readonly offlineDrive: OfflineDriveDependencyContainer,
    private readonly virtualDrive: VirtualDriveDependencyContainer
  ) {
    super('Release', { input: true, output: true });
  }

  async execute(path: string, _fd: number) {
    const name = basename(path);
    if (name.startsWith('.~lock.')) {
      Logger.debug('Ignoring .lock file', path);
      return this.right();
    }

    const extension = extname(path);
    if (extension === '.tmp') {
      Logger.debug('Ignoring .tmp file', path);
      return this.right();
    }

    const offlineFile = await this.offlineDrive.offlineFileSearcher.run({
      path,
    });

    if (offlineFile) {
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
  }
}
