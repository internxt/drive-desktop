import Logger from 'electron-log';
import fs from 'fs/promises';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class ReadCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  private readonly buffers = new Map<string, Buffer>();

  private async obtainBufferFor(filePath: string): Promise<Buffer> {
    const cachedBuffer = this.buffers.get(filePath);
    if (cachedBuffer) {
      return cachedBuffer;
    }

    return fs.readFile(filePath);
  }

  private async read(
    source: Buffer,
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<number> {
    if (position >= source.length) {
      Logger.debug('READ DONE');
      return 0;
    }

    const part = source.slice(position, position + length);
    part.copy(buffer);

    return part.length;
  }

  async execute(
    path: string,
    _fileHandle: number,
    buf: Buffer,
    len: number,
    pos: number,
    cb: (result: number) => void
  ) {
    const file = await this.container.filesSearcher.run({ path });

    if (!file) {
      cb(fuse.ENOENT);
      return;
    }

    const filePath = this.container.relativePathToAbsoluteConverter.run(
      file.contentsId
    );

    try {
      Logger.debug('READING FILE FROM ', filePath, len, pos);

      const source = await this.obtainBufferFor(filePath);

      const bytesRead = await this.read(source, buf, len, pos);

      if (bytesRead === 0) {
        this.buffers.delete(filePath);
      }

      cb(bytesRead);
    } catch (err) {
      Logger.error(`Error reading file: ${err}`);
      cb(fuse.ENOENT);
    }
  }
}
