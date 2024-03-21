import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import Logger from 'electron-log';

export class WriteCallback {
  constructor(private readonly container: OfflineDriveDependencyContainer) {}

  async execute(
    path: string,
    _fd: string,
    buffer: Buffer,
    len: number,
    pos: number,
    cb: (a: number) => void
  ) {
    Logger.debug('WRITE: ', path, len, pos);

    await this.container.offlineContentsAppender.run(path, buffer);

    return cb(len);
  }
}
