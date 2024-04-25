import { Service } from 'diod';
import { StorageFileCache } from '../../domain/StorageFileCache';
import { StorageFileRepository } from '../../domain/StorageFileRepository';

@Service()
export class StorageClearer {
  constructor(
    private readonly cache: StorageFileCache,
    private readonly repo: StorageFileRepository
  ) {}

  async run(): Promise<void> {
    await this.cache.clear();

    await this.repo.deleteAll();
  }
}
