import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { SingleFileMatchingFinder } from '../../../../virtual-drive/files/application/SingleFileMatchingFinder';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';
import { StorageFileId } from '../../domain/StorageFileId';
import { StorageFilesRepository } from '../../domain/StorageFilesRepository';
import { StorageFileDownloader } from '../download/StorageFileDownloader/StorageFileDownloader';
import { DownloadProgressTracker } from '../../../../shared/domain/DownloadProgressTracker';
import { downloadWithProgressTracking } from '../download/download-with-progress-tracking';

@Service()
export class MakeStorageFileAvaliableOffline {
  constructor(
    private readonly repository: StorageFilesRepository,
    private readonly virtualFileFinder: SingleFileMatchingFinder,
    private readonly downloader: StorageFileDownloader,
    private readonly tracker: DownloadProgressTracker,
  ) {}

  async run(path: string) {
    const virtual = await this.virtualFileFinder.run({
      path,
      status: FileStatuses.EXISTS,
    });

    const id = new StorageFileId(virtual.contentsId);

    const alreadyExists = await this.repository.exists(id);
    if (alreadyExists) return;

    const storagedFile = await downloadWithProgressTracking({
      virtualFile: virtual,
      tracker: this.tracker,
      downloader: this.downloader,
      repository: this.repository,
    });

    logger.debug({
      msg: `File "${virtual.nameWithExtension}" with ${storagedFile.id.value} is now avaliable locally`,
    });
  }
}
