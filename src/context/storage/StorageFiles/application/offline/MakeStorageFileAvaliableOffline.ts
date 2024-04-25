import { Service } from 'diod';
import { StorageFileRepository } from '../../domain/StorageFileRepository';
import { StorageFilePath } from '../../domain/StorageFilePath';
import { StorageFileDownloader } from '../download/StorageFileDownloader';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';
import { SingleFileMatchingFinder } from '../../../../virtual-drive/files/application/SingleFileMatchingFinder';
import { StorageFile } from '../../domain/StorageFile';

@Service()
export class MakeStorageFileAvaliableOffline {
  constructor(
    private readonly repository: StorageFileRepository,
    private readonly virtualFileFinder: SingleFileMatchingFinder,
    private readonly downloader: StorageFileDownloader
  ) {}

  async run(path: string) {
    const storagePath = new StorageFilePath(path);

    const alreadyExists = await this.repository.exists(storagePath);

    if (alreadyExists) {
      return;
    }

    const virtual = await this.virtualFileFinder.run({
      path,
      status: FileStatuses.EXISTS,
    });

    const storage = StorageFile.from({
      id: virtual.contentsId,
      path: virtual.path,
      size: virtual.size,
    });

    const readable = await this.downloader.run(storage);
    await this.repository.store(storage, readable);
  }
}
