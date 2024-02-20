import fs, { PathLike } from 'fs';
import { stat } from 'fs/promises';
import { Readable } from 'stream';

export class WriteReadableToFile {
  static write(
    readable: Readable,
    path: PathLike,
    expectedSize?: number
  ): Promise<void> {
    const writableStream = fs.createWriteStream(path);

    readable.pipe(writableStream);

    return new Promise<void>((resolve, reject) => {
      writableStream.on('finish', async () => {
        const { size } = await stat(path);

        if (!expectedSize) {
          resolve();
          return;
        }
        if (size !== expectedSize) {
          reject(new Error('Wried file does not have expected size'));
          return;
        }

        resolve();
      });

      writableStream.on('error', reject);
    });
  }
}
