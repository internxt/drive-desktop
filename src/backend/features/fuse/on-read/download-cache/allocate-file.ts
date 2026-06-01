import fs from 'node:fs/promises';

/**
 * Pre-allocates a file on disk to the full expected size before any ranges are downloaded.
 *
 * This is necessary for random-access writes: since FUSE reads can arrive in any order,
 * we need the file to exist at its full size so we can write each range at its correct
 * byte offset. Without pre-allocation, writing at offset 500MB would fail because the
 * file doesn't exist yet.
 *
 * The file is filled with zeros initially, the {@link rangeRegistry} tracks which regions
 * contain real downloaded bytes vs unfilled zeros.
 */
export async function allocateFile(filePath: string, size: number): Promise<void> {
  const handle = await fs.open(filePath, 'w');
  try {
    await handle.truncate(size);
  } finally {
    await handle.close();
  }
}
