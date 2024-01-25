import fs, { PathLike } from 'fs';
import { Readable } from 'stream';

export class WriteReadableToFile {
  static write(readable: Readable, path: PathLike): Promise<void> {
    const writableStream = fs.createWriteStream(path);

    readable.pipe(writableStream);

    return new Promise<void>((resolve, reject) => {
      writableStream.on('finish', resolve);
      writableStream.on('error', reject);
    });
  }
}
