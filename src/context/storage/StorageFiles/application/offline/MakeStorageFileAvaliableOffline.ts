import { Service } from 'diod';
import Logger from 'electron-log';
import { SingleFileMatchingFinder } from '../../../../virtual-drive/files/application/SingleFileMatchingFinder';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';
import { StorageFile } from '../../domain/StorageFile';
import { StorageFileId } from '../../domain/StorageFileId';
import { StorageFilesRepository } from '../../domain/StorageFilesRepository';
import { StorageFileDownloader } from '../download/StorageFileDownloader';

@Service()
export class MakeStorageFileAvaliableOffline {
  constructor(
    private readonly repository: StorageFilesRepository,
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
      virtualId: virtual.uuid,
      size: virtual.size,
    });

    const readable = await this.downloader.run(storage, virtual);
    await this.repository.store(storage, readable);

    Logger.debug(
      `File "${virtual.nameWithExtension}" with ${storage.id.value} is now avaliable offline`
    );
  }
}
