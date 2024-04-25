import { Service } from 'diod';
import { StorageFileCache } from '../../../domain/StorageFileCache';
import { StorageFileId } from '../../../domain/StorageFileId';

@Service()
export class InMemoryStorageFileCache implements StorageFileCache {
  private buffers: Map<StorageFileId['value'], Buffer> = new Map();

  async has(id: StorageFileId): Promise<boolean> {
    return this.buffers.has(id.value);
  }

  async store(id: StorageFileId, value: Buffer): Promise<void> {
    this.buffers.set(id.value, value);
  }

  async read(id: StorageFileId): Promise<Buffer> {
    const buffer = this.buffers.get(id.value);

    if (!buffer) {
      throw new Error(`${id.value} is not cached`);
    }

    return buffer;
  }

  async delete(id: StorageFileId): Promise<void> {
    this.buffers.delete(id.value);
  }

  async clear(): Promise<void> {
    this.buffers.clear();
  }
}
