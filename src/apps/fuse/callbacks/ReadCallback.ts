import Logger from 'electron-log';
import fs from 'fs/promises';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class ReadCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  private async read(
    filePath: string,
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<number> {
    // Logger.debug('READING FILE FROM ', filePath, length, position);

    const data = await fs.readFile(filePath);

    if (position >= data.length) {
      Logger.debug('READ DONE');
      return 0;
    }

    const part = data.slice(position, position + length);
    part.copy(buffer); // write the result of the read to the result buffer
    return part.length; // number of bytes read
  }

  async execute(
    path: string,
    _fd: any,
    buf: Buffer,
    len: number,
    pos: number,
    cb: (code: number, params?: any) => void
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
      const bytesRead = await this.read(filePath, buf, len, pos);
      cb(bytesRead);
    } catch (err) {
      Logger.error(`Error reading file: ${err}`);
      cb(fuse.ENOENT);
    }
  }
}
