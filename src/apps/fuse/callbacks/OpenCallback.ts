import { Container } from 'diod';
import Logger from 'electron-log';
import { OfflineFileSearcher } from '../../../context/offline-drive/files/application/OfflineFileSearcher';
import { DownloadContentsToPlainFile } from '../../../context/virtual-drive/contents/application/DownloadContentsToPlainFile';
import { FirstsFileSearcher } from '../../../context/virtual-drive/files/application/FirstsFileSearcher';
import { FuseCallback } from './FuseCallback';
import { FuseIOError, FuseNoSuchFileOrDirectoryError } from './FuseErrors';

export class OpenCallback extends FuseCallback<number> {
  constructor(private readonly container: Container) {
    super('Open');
  }

  async execute(path: string, _flags: Array<any>) {
    const virtual = await this.container.get(FirstsFileSearcher).run({ path });

    if (!virtual) {
      const offline = await this.container
        .get(OfflineFileSearcher)
        .run({ path });
      if (offline) {
        return this.right(0);
      }
      return this.left(new FuseNoSuchFileOrDirectoryError(path));
    }

    try {
      await this.container.get(DownloadContentsToPlainFile).run(virtual);

      return this.right(0);
    } catch (err: unknown) {
      Logger.error('Error downloading file: ', err);
      if (err instanceof Error) {
        return this.left(new FuseIOError());
      }
      return this.left(new FuseIOError());
    }
  }
}
