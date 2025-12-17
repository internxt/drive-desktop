import { Readable } from 'node:stream';

export function createReadable(content: string): Readable {
  const readable = new Readable();
  readable.push(content);
  readable.push(null);

  return readable;
}
