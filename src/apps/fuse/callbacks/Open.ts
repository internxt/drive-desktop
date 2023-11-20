import { DependencyContainer } from '../dependency-injection/DependencyContainer';
import { Callback } from './Callback';
import Logger from 'electron-log';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class Open {
  constructor(private readonly container: DependencyContainer) {}

  async execute(path: string, _flags: Array<any>, cb: Callback): Promise<void> {
    Logger.debug('OPEN ', path);
    const file = await this.container.filesSearcher.run({ path });

    if (!file) {
      return cb(fuse.ENOENT);
    }

    Logger.debug(path, ' FOUNDED', file.contentsId);

    try {
      Logger.info('[FUSE] Starting the download of ', path);

      await this.container.downloadContentsToPlainFile.run(file);

      Logger.info('[FUSE] Download ended ', path);
      cb(0, file.id);
    } catch (err: unknown) {
      Logger.error('[FUSE] Error downloading file: ', err);
      cb(fuse.EIO);
    }
  }
}
