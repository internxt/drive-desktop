import { Service } from 'diod';
import { SingleFileMatchingFinder } from '../../../../virtual-drive/files/application/SingleFileMatchingFinder';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';
import { StorageFileCache } from '../../domain/StorageFileCache';
import { StorageFileId } from '../../domain/StorageFileId';
import { StorageFileRepository } from '../../domain/StorageFileRepository';

@Service()
export class StorageFileDeleter {
  constructor(
    private readonly repository: StorageFileRepository,
    private readonly virtualFileFinder: SingleFileMatchingFinder,
    private readonly cache: StorageFileCache
  ) {}

  async run(path: string) {
    const virtual = await this.virtualFileFinder.run({
      path,
      status: FileStatuses.EXISTS,
    });

    const id = new StorageFileId(virtual.contentsId);

    const exists = await this.repository.exists(id);

    if (!exists) {
      return;
    }

    const file = await this.repository.retrieve(id);

    await this.repository.delete(file.id);

    const isCached = await this.cache.has(file.id);

    if (isCached) {
      this.cache.delete(file.id);
    }
  }
}
