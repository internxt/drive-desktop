import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import Logger from 'electron-log';
import { FuseCallback } from './FuseCallback';
import { FuseNoSuchFileOrDirectoryError } from './FuseErrors';

export class OpenCallback extends FuseCallback<number> {
  constructor(private readonly container: VirtualDriveDependencyContainer) {
    super('Open');
  }

  async execute(path: string, _flags: Array<any>) {
    const file = await this.container.filesSearcher.run({ path });

    if (!file) {
      return this.left(new FuseNoSuchFileOrDirectoryError());
    }

    const alreadyDownloaded = await this.container.localContentChecker.run(
      file
    );

    if (alreadyDownloaded) {
      Logger.debug(
        `[Local Cache] "${file.nameWithExtension}" contents are already in local`
      );
      return this.right(file.id);
    }

    Logger.debug(`"${file.nameWithExtension}" contents are not in local`);
    await this.container.downloadContentsToPlainFile.run(file);

    return this.right(file.id);
  }
}
