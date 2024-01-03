import Logger from 'electron-log';
import fs from 'fs';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class ReadCallback {
  constructor(private readonly container: VirtualDriveDependencyContainer) {}

  async execute(
    path: string,
    fd: any,
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

    fs.readFile(filePath, (err, data) => {
      if (err) {
        Logger.error(`Error reading file: ${err}`);
        cb(fuse.ENOENT);
        return;
      }

      const dataBuffer = Buffer.from(data);

      const bytesRead = Math.min(dataBuffer.length - pos, len);

      dataBuffer.copy(buf, 0, pos, pos + bytesRead);

      cb(bytesRead); // Indicate the number of bytes read ????????????
    });
  }
}
