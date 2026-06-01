import fs from 'node:fs/promises';
// TODO: Rename chunk -> block
export async function writeChunkToDisk(filePath: string, buffer: Buffer, position: number): Promise<void> {
  const handle = await fs.open(filePath, 'r+');
  try {
    await handle.write(new Uint8Array(buffer), 0, buffer.length, position);
  } finally {
    await handle.close();
  }
}

export async function readChunkFromDisk(filePath: string, length: number, position: number): Promise<Buffer> {
  const handle = await fs.open(filePath, 'r');

  try {
    // Buffer extends Uint8Array at runtime, but @types/node@22 introduced a type
    // incompatibility due to SharedArrayBuffer variance. The cast is safe.
    const buffer = Buffer.alloc(length) as unknown as Uint8Array;

    const { bytesRead } = await handle.read(buffer, 0, length, position);
    return Buffer.from(buffer.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}
