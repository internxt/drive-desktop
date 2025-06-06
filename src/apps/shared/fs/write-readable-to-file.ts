import fs, { PathLike } from 'fs';
import { stat } from 'fs/promises';
import { Readable } from 'stream';

export class WriteReadableToFile {
  static write(readable: Readable, path: PathLike, expectedSize?: number): Promise<void> {
    const writableStream = fs.createWriteStream(path);

    readable.pipe(writableStream);

    return new Promise<void>((resolve, reject) => {
      writableStream.on('finish', async () => {
        const { size } = await stat(path);

        if (!expectedSize) {
          resolve();
          return;
        }
        const tolerance = 1; // set the tolerance value to 1 byte
        if (Math.abs(size - expectedSize) <= tolerance) {
          resolve();
        } else {
          reject(new Error('Wried file does not have expected size'));
        }

        resolve();
      });

      writableStream.on('error', reject);
    });
  }
}
