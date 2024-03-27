import Logger from 'electron-log';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';
import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { Optional } from '../../../shared/types/Optional';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class ReadCallback {
  constructor(
    private readonly virtualDrive: VirtualDriveDependencyContainer,
    private readonly offlineDrive: OfflineDriveDependencyContainer
  ) {}

  private async read(
    filePath: string,
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<number> {
    const readResult = await this.offlineDrive.contentsChunkReader.run(
      filePath,
      length,
      position
    );

    if (!readResult.isPresent()) {
      return 0;
    }

    const chunk = readResult.get();

    chunk.copy(buffer); // write the result of the read to the result buffer
    return chunk.length; // number of bytes read
  }

  private async copyToBuffer(buffer: Buffer, bufferOptional: Optional<Buffer>) {
    if (!bufferOptional.isPresent()) {
      return 0;
    }

    const chunk = bufferOptional.get();

    chunk.copy(buffer); // write the result of the read to the result buffer
    return chunk.length; // number of bytes read
  }

  async execute(
    path: string,
    _fd: any,
    buf: Buffer,
    len: number,
    pos: number,
    cb: (code: number, params?: any) => void
  ) {
    const virtualFile = await this.virtualDrive.filesSearcher.run({ path });

    if (!virtualFile) {
      const offlineFile = await this.offlineDrive.offlineFileSearcher.run({
        path,
      });

      if (!offlineFile) {
        Logger.error('READ FILE NOT FOUND', path);
        cb(fuse.ENOENT);
        return;
      }

      const chunk =
        await this.offlineDrive.auxiliarOfflineContentsChucksReader.run(
          offlineFile.id,
          len,
          pos
        );

      const result = await this.copyToBuffer(buf, chunk);

      cb(result);
      return;
    }

    const filePath = this.virtualDrive.relativePathToAbsoluteConverter.run(
      virtualFile.contentsId
    );

    try {
      const bytesRead = await this.read(filePath, buf, len, pos);
      cb(bytesRead);
    } catch (err) {
      Logger.error(`Error reading file: ${err}`);
      cb(fuse.EIO);
    }
  }
}
