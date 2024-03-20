import { ContentsRepository } from '../../domain/ContentsRepository';
import fs from 'fs/promises';

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

  forget(_path: string): void {
    //
  }
}
