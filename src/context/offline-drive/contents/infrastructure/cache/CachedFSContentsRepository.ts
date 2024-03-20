import { ContentsRepository } from '../../domain/ContentsRepository';
import fs from 'fs/promises';
import Logger from 'electron-log';
import { basename } from 'path';
export class CachedFSContentsRepository implements ContentsRepository {
  private buffers: Map<string, Buffer> = new Map();

  async read(path: string): Promise<Buffer> {
    const cached = this.buffers.get(path);

    if (cached) {
      return cached;
    }

    const read = await fs.readFile(path);
    this.buffers.set(path, read);

    return read;
  }

  async forget(path: string): Promise<void> {
    const deleted = this.buffers.delete(path);

    if (deleted) {
      Logger.debug(`Buffer from ${basename(path)} deleted from cache`);
    }
  }
}
