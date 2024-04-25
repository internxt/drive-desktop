import { Service } from 'diod';
import { StorageFileRepository } from '../../domain/StorageFileRepository';
import { StorageFileDownloader } from '../download/StorageFileDownloader';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';
import { SingleFileMatchingFinder } from '../../../../virtual-drive/files/application/SingleFileMatchingFinder';
import { StorageFile } from '../../domain/StorageFile';
import { StorageFileId } from '../../domain/StorageFileId';

@Service()
export class MakeStorageFileAvaliableOffline {
  constructor(
    private readonly repository: StorageFileRepository,
    private readonly virtualFileFinder: SingleFileMatchingFinder,
    private readonly downloader: StorageFileDownloader
  ) {}

  async run(path: string) {
    const virtual = await this.virtualFileFinder.run({
      path,
      status: FileStatuses.EXISTS,
    });

    const id = new StorageFileId(virtual.contentsId);

    const alreadyExists = await this.repository.exists(id);

    if (alreadyExists) {
      return;
    }

    const storage = StorageFile.from({
      id: virtual.contentsId,
      size: virtual.size,
    });

    const readable = await this.downloader.run(storage, virtual);
    await this.repository.store(storage, readable);
  }
}
