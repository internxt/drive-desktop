import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';

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
    await this.container.offlineContentsAppender.run(path, buffer, len, pos);

    return cb(len);
  }
}
