import { Service } from 'diod';
import { StorageFileCache } from '../../domain/StorageFileCache';
import { StorageFileId } from '../../domain/StorageFileId';

@Service()
export class StorageCacheDeleter {
  constructor(private readonly cache: StorageFileCache) {}

  async run(id: string): Promise<void> {
    const localFileId = new StorageFileId(id);

    await this.cache.delete(localFileId);
  }
}
