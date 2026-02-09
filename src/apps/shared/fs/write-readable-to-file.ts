import fs, { PathLike } from 'fs';
import { Readable } from 'stream';

type Props = {
  readable: Readable;
  path: PathLike;
  onProgress: (bytesWritten: number) => void;
};

export function writeReadableToFile({ readable, path, onProgress }: Props) {
  const writableStream = fs.createWriteStream(path);

  let bytesWritten = 0;

  readable.on('data', (chunk: Buffer) => {
    bytesWritten += chunk.length;
    onProgress(bytesWritten);
  });

  readable.pipe(writableStream);

  return new Promise<void>((resolve, reject) => {
    writableStream.on('finish', resolve);
    writableStream.on('error', reject);
  });
}
