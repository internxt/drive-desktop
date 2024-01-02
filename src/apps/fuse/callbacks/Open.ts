import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { Callback } from './Callback';
import Logger from 'electron-log';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class Open {
  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  async execute(path: string, _flags: Array<any>, cb: Callback): Promise<void> {
    Logger.debug('OPEN ', path);
    const file = await this.container.filesSearcher.run({ path });

    if (!file) {
      return cb(fuse.ENOENT);
    }

    const alreadyDownloaded = await this.container.localContentChecker.run(
      file
    );

    if (alreadyDownloaded) {
      Logger.debug('[FUSE] File contents already in local');
      cb(0, file.id);
      return;
    }

    try {
      Logger.debug('[FUSE] File contents not in local');
      await this.container.downloadContentsToPlainFile.run(file);

      cb(0, file.id);
    } catch (err: unknown) {
      Logger.error('[FUSE] Error downloading file: ', err);
      cb(fuse.EIO);
    }
  }
}
