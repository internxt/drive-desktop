import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { FuseCallback } from './FuseCallback';

export class WriteCallback extends FuseCallback<number> {
  constructor(private readonly container: OfflineDriveDependencyContainer) {
    super('Write');
  }

  async execute(
    path: string,
    _fd: string,
    buffer: Buffer,
    len: number,
    pos: number
  ) {
    await this.container.offlineContentsAppender.run(path, buffer, len, pos);

    return this.right(len);
  }
}
