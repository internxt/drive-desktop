import { Service } from 'diod';
import { StorageFileRepository } from '../../domain/StorageFileRepository';
import { SingleFileMatchingFinder } from '../../../../virtual-drive/files/application/SingleFileMatchingFinder';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';
import { StorageFileId } from '../../domain/StorageFileId';

@Service()
export class StorageFileIsAvailableOffline {
  constructor(
    private readonly virtualFileFinder: SingleFileMatchingFinder,
    private readonly repository: StorageFileRepository
  ) {}

  async run(path: string) {
    const virtual = await this.virtualFileFinder.run({
      path,
      status: FileStatuses.EXISTS,
    });

    const id = new StorageFileId(virtual.contentsId);

    return await this.repository.exists(id);
  }
}
