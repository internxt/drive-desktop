import { Service } from 'diod';
import { StorageFileCache } from '../../domain/StorageFileCache';
import { StorageFilesRepository } from '../../domain/StorageFilesRepository';

@Service()
export class StorageClearer {
  constructor(
    private readonly cache: StorageFileCache,
    private readonly repo: StorageFilesRepository
  ) {}

  async run(): Promise<void> {
    await this.cache.clear();

    await this.repo.deleteAll();
  }
}
