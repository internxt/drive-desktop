import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { TypedCallback } from './Callback';

type WriteFileCallback = TypedCallback<number>;

export class WriteFile {
  constructor(private readonly container: OfflineDriveDependencyContainer) {}

  async execute(
    path: string,
    _fd: string,
    buffer: Buffer,
    len: number,
    pos: number,
    cb: WriteFileCallback
  ): Promise<void> {
    await this.container.writeToOfflineFile.run(path, buffer, len, pos);

    cb(len);
  }
}
