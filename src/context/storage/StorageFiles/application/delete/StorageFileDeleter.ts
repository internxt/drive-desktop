import { Service } from 'diod';
import { StorageFileRepository } from '../../domain/StorageFileRepository';
import { StorageFileCache } from '../../domain/StorageFileCache';
import { StorageFilePath } from '../../domain/StorageFilePath';

@Service()
export class StorageFileDeleter {
  constructor(
    private readonly repository: StorageFileRepository,
    private readonly cache: StorageFileCache
  ) {}

  async run(path: string) {
    const storagePath = new StorageFilePath(path);

    const exists = await this.repository.exists(storagePath);

    if (!exists) {
      return;
    }

    const file = await this.repository.retrieve(storagePath);

    await this.repository.delete(file.id);

    const isCached = await this.cache.has(file.id);

    if (isCached) {
      this.cache.delete(file.id);
    }
  }
}
