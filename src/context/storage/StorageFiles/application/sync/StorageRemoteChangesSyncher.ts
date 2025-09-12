import { Service } from 'diod';
import { SingleFileMatchingSearcher } from '../../../../virtual-drive/files/application/search/SingleFileMatchingSearcher';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';
import { StorageFile } from '../../domain/StorageFile';
import { StorageFilesRepository } from '../../domain/StorageFilesRepository';
import { StorageFileDownloader } from '../download/StorageFileDownloader/StorageFileDownloader';
import { logger } from '@internxt/drive-desktop-core/build/backend';

@Service()
export class StorageRemoteChangesSyncher {
  constructor(
    private readonly repository: StorageFilesRepository,
    private readonly fileSearcher: SingleFileMatchingSearcher,
    private readonly downloader: StorageFileDownloader
  ) {}

  private async sync(storage: StorageFile): Promise<void> {
    const virtualFile = await this.fileSearcher.run({
      uuid: storage.virtualId.value,
      status: FileStatuses.EXISTS,
    });

    if (!virtualFile) {
      await this.repository.delete(storage.id);
      return;
    }

    if (virtualFile.contentsId === storage.id.value) {
      return;
    }

    await this.repository.delete(storage.id);

    const newer = StorageFile.from({
      id: virtualFile.contentsId,
      virtualId: storage.virtualId.value,
      size: virtualFile.size,
    });

    const readable = await this.downloader.run(newer, virtualFile);
    await this.repository.store(newer, readable);

    logger.debug({
      msg: `File "${virtualFile.nameWithExtension}" with ${newer.id.value} is avaliable offline`,
    });
  }

  async run(): Promise<void> {
    const all = await this.repository.all();

    const synced = all.map(this.sync.bind(this));

    await Promise.all(synced);
  }
}
