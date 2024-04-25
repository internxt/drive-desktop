import { Service } from 'diod';
import { StorageFileRepository } from '../../domain/StorageFileRepository';
import { StorageFilePath } from '../../domain/StorageFilePath';

@Service()
export class StorageFileIsAvailableOffline {
  constructor(private readonly repository: StorageFileRepository) {}

  async run(path: string) {
    const storagePath = new StorageFilePath(path);

    return await this.repository.exists(storagePath);
  }
}
