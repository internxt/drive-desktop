import { Readable } from 'stream';
import { ContentsCacheRepository } from '../../domain/ContentsCacheRepository';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import Logger from 'electron-log';
import glob from 'tiny-glob';

export class FSContentsCacheRepository implements ContentsCacheRepository {
  private static readonly TWO_GB = 2 * 1024 * 1024 * 1024;
  private static readonly directoryName = 'File Cache';

  private readonly cachedFilesAccessTime = new Map<string, number>();
  private readonly directory: string;
  private readonly maxCacheSize: number;

  constructor(where: string, maxCacheSize: number | null = null) {
    this.directory = path.join(where, FSContentsCacheRepository.directoryName);
    this.maxCacheSize = maxCacheSize || FSContentsCacheRepository.TWO_GB;
  }

  private getOldestAccessedFile(): string | undefined {
    if (this.cachedFilesAccessTime.size === 0) {
      return undefined;
    }

    let oldestTimestamp: number | null = null;
    let oldestId: string | null = null;

    for (const [id, accessed] of this.cachedFilesAccessTime) {
      if (oldestTimestamp === null || accessed < oldestTimestamp) {
        oldestTimestamp = accessed;
        oldestId = id;
      }
    }

    return oldestId || undefined;
  }

  private async ensureFileCacheContained(size: number): Promise<void> {
    if (size >= this.maxCacheSize) {
      return Promise.reject('File is too large to be cached');
    }

    let current = await this.usage();

    while (
      current + size >= this.maxCacheSize &&
      this.cachedFilesAccessTime.size > 0
    ) {
      const oldestAccessed = this.getOldestAccessedFile();

      if (oldestAccessed) {
        // eslint-disable-next-line no-await-in-loop
        await this.delete(oldestAccessed);

        this.cachedFilesAccessTime.delete(oldestAccessed);
      }

      // eslint-disable-next-line no-await-in-loop
      current = await this.usage();
    }
  }

  private assemblePath(fileId: string) {
    return path.join(this.directory, fileId);
  }

  async initialize(): Promise<void> {
    Logger.info('Initializing, file cache...');
    fs.mkdir(this.directory);

    const cached = await glob('**', {
      filesOnly: true,
      absolute: false,
      dot: false,
      flush: true,
      cwd: this.directory,
    });

    const populate = cached.map(async (id) => {
      const { atimeMs } = await fs.stat(path.join(this.directory, id));

      this.cachedFilesAccessTime.set(id, atimeMs);
    });

    await Promise.all(populate);
  }

  exists(fileId: string): boolean {
    return this.cachedFilesAccessTime.has(fileId);
  }

  read(fileId: string): Readable {
    const stream = createReadStream(this.assemblePath(fileId));

    this.cachedFilesAccessTime.set(fileId, Date.now());

    return stream;
  }

  async write(fileId: string, content: Readable, size: number): Promise<void> {
    await this.ensureFileCacheContained(size);

    await fs.writeFile(this.assemblePath(fileId), content, { flag: 'w' });

    this.cachedFilesAccessTime.set(fileId, Date.now());
  }

  delete(fileId: string): Promise<void> {
    return fs.unlink(this.assemblePath(fileId));
  }

  async usage(): Promise<number> {
    const stats = await fs.stat(this.directory);

    return stats.size;
  }
}
