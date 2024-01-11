import Logger from 'electron-log';
import fs from 'fs';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class ReadCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  async execute(
    path: string,
    _fd: any,
    buf: Buffer,
    len: number,
    pos: number,
    cb: (code: number, params?: any) => void
  ) {
    Logger.debug(`READ ${path}`);

    const file = await this.container.filesSearcher.run({ path });

    if (!file) {
      cb(fuse.ENOENT);
      return;
    }

    const filePath = this.container.relativePathToAbsoluteConverter.run(
      file.contentsId
    );

    Logger.debug('READING FILE FROM ', filePath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        Logger.error(`Error reading file: ${err}`);
        cb(fuse.ENOENT);
        return;
      }

      if (pos >= data.length) return cb(0);

      // const bytesRead = Math.min(buffer.length - pos, len);
      const part = data.slice(pos, pos + len);

      part.copy(buf);

      cb(part.length); // Indicate the number of bytes read ????????????
    });
  }
}
