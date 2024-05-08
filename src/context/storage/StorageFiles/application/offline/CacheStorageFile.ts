import { Service } from 'diod';
import Logger from 'electron-log';
import { SingleFileMatchingFinder } from '../../../../virtual-drive/files/application/SingleFileMatchingFinder';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';
import { StorageFile } from '../../domain/StorageFile';
import { StorageFileId } from '../../domain/StorageFileId';
import { StorageFileDownloader } from '../download/StorageFileDownloader';
import { StorageFileCache } from '../../domain/StorageFileCache';

@Service()
export class CacheStorageFile {
  constructor(
    private readonly virtualFileFinder: SingleFileMatchingFinder,
    private readonly cache: StorageFileCache,
    private readonly downloader: StorageFileDownloader
  ) {}

  async run(path: string) {
    const virtual = await this.virtualFileFinder.run({
      path,
      status: FileStatuses.EXISTS,
    });

    const id = new StorageFileId(virtual.contentsId);

    const alreadyExists = await this.cache.has(id);

    if (alreadyExists) {
      return;
    }

    const storage = StorageFile.from({
      id: virtual.contentsId,
      virtualId: virtual.uuid,
      size: virtual.size,
    });

    const readable = await this.downloader.run(storage, virtual);
    await this.cache.pipe(id, readable);

    Logger.debug(
      `File "${virtual.nameWithExtension}" with ${storage.id.value} is cached`
    );
  }
}
