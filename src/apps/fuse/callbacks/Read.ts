import Logger from 'electron-log';
import fs from 'fs';
import { VirtualDriveDependencyContainer } from '../dependency-injection/virtual-drive/VirtualDriveDependencyContainer';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class Read {
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
        console.error(`Error reading file: ${err}`);
        cb(fuse.ENOENT); // Indicate an error code, e.g., if the file doesn't exist
        return;
      }

      // Convert the data to a Buffer
      const dataBuffer = Buffer.from(data);

      // Determine the number of bytes to read based on the length and position
      const bytesRead = Math.min(dataBuffer.length - pos, len);

      // Copy the data to the provided buffer
      dataBuffer.copy(buf, 0, pos, pos + bytesRead);

      cb(bytesRead); // Indicate the number of bytes read}
    });
  }
}
