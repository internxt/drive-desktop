import { Service } from 'diod';
import { LocalFileCache } from '../../domain/LocalFileCache';
import { LocalFileId } from '../../domain/LocalFileId';

@Service()
export class InMemoryLocalFileCache implements LocalFileCache {
  private buffers: Map<LocalFileId['value'], Buffer> = new Map();

  async has(id: LocalFileId): Promise<boolean> {
    return this.buffers.has(id.value);
  }

  async store(id: LocalFileId, value: Buffer): Promise<void> {
    this.buffers.set(id.value, value);
  }

  async read(id: LocalFileId): Promise<Buffer> {
    const buffer = this.buffers.get(id.value);

    if (!buffer) {
      throw new Error(`${id.value} is not cached`);
    }

    return buffer;
  }

  async delete(id: LocalFileId): Promise<void> {
    this.buffers.delete(id.value);
  }

  async clear(): Promise<void> {
    this.buffers.clear();
  }
}
