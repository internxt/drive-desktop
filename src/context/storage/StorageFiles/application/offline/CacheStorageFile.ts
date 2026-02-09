import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { SingleFileMatchingFinder } from '../../../../virtual-drive/files/application/SingleFileMatchingFinder';
import { FileStatuses } from '../../../../virtual-drive/files/domain/FileStatus';
import { StorageFile } from '../../domain/StorageFile';
import { StorageFileId } from '../../domain/StorageFileId';
import { StorageFileDownloader } from '../download/StorageFileDownloader/StorageFileDownloader';
import { StorageFileCache } from '../../domain/StorageFileCache';
import { DownloadProgressTracker } from '../../../../shared/domain/DownloadProgressTracker';
import { getDownloadLock, setDownloadLock } from './download-lock';
import { File } from '../../../../../context/virtual-drive/files/domain/File';

@Service()
export class CacheStorageFile {
  constructor(
    private readonly virtualFileFinder: SingleFileMatchingFinder,
    private readonly cache: StorageFileCache,
    private readonly downloader: StorageFileDownloader,
    private readonly tracker: DownloadProgressTracker,
  ) {}

  async run(path: string) {
    const virtual = await this.virtualFileFinder.run({
      path,
      status: FileStatuses.EXISTS,
    });

    if (virtual.size === 0) {
      logger.debug({
        msg: `File "${virtual.nameWithExtension}" has size 0, skipping download`,
      });
      return;
    }

    const id = new StorageFileId(virtual.contentsId);

    const alreadyExists = await this.cache.has(id);
    if (alreadyExists) return;

    let downloadPromise = getDownloadLock(id.value);
    if (!downloadPromise) {
      downloadPromise = this.performDownload(id, virtual);
      setDownloadLock(id.value, downloadPromise);
    }

    await downloadPromise;
  }

  private async performDownload(id: StorageFileId, virtual: File) {
    const storage = StorageFile.from({
      id: virtual.contentsId,
      virtualId: virtual.uuid,
      size: virtual.size,
    });

    this.tracker.downloadStarted(virtual.name, virtual.type);
    const { stream, metadata, handler } = await this.downloader.run(storage, virtual);

    await this.cache.pipe(id, stream, (bytesWritten) => {
      const progress = Math.min(bytesWritten / virtual.size, 1);
      this.tracker.downloadUpdate(metadata.name, metadata.type, {
        percentage: progress,
        elapsedTime: handler.elapsedTime(),
      });
    });

    this.tracker.downloadFinished(metadata.name, metadata.type);

    logger.debug({
      msg: `File "${virtual.nameWithExtension}" with ${storage.id.value} is cached`,
    });
  }
}
