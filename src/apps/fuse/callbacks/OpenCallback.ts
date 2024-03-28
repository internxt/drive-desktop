import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import Logger from 'electron-log';
import { FuseCallback } from './FuseCallback';
import { FuseIOError, FuseNoSuchFileOrDirectoryError } from './FuseErrors';
import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';

export class OpenCallback extends FuseCallback<number> {
  constructor(
    private readonly virtual: VirtualDriveDependencyContainer,
    private readonly offline: OfflineDriveDependencyContainer
  ) {
    super('Open');
  }

  async execute(path: string, _flags: Array<any>) {
    const virtual = await this.virtual.filesSearcher.run({ path });

    if (!virtual) {
      const offline = await this.offline.offlineFileSearcher.run({ path });
      if (offline) {
        return this.right(0);
      }
      return this.left(new FuseNoSuchFileOrDirectoryError(path));
    }

    try {
      await this.virtual.downloadContentsToPlainFile.run(virtual);

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
