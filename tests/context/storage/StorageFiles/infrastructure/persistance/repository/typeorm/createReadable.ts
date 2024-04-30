import { Readable } from 'stream';

export function createReadable(content: string): Readable {
  const readable = new Readable();
  readable.push(content);
  readable.push(null);

  return readable;
}
