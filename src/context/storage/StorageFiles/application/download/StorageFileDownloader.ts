import { Service } from 'diod';
import Logger from 'electron-log';
import { Readable } from 'stream';
import { DownloadProgressTracker } from '../../../../shared/domain/DownloadProgressTracker';
import { DownloaderHandlerFactory } from '../../domain/download/DownloaderHandlerFactory';
import { DownloaderHandler } from '../../domain/download/DownloaderHandler';
import { StorageFile } from '../../domain/StorageFile';

@Service()
export class StorageFileDownloader {
  constructor(
    private readonly managerFactory: DownloaderHandlerFactory,
    private readonly tracker: DownloadProgressTracker
  ) {}

  private async registerEvents(handler: DownloaderHandler, file: StorageFile) {
    handler.on('start', () => {
      this.tracker.downloadStarted(file.name, file.extension, file.size.value);
    });

    handler.on('progress', (progress: number, elapsedTime: number) => {
      this.tracker.downloadUpdate(file.name, file.extension, {
        elapsedTime,
        percentage: progress,
      });
    });

    handler.on('error', () => {
      this.tracker.error(file.name, file.extension);
    });
  }

  async run(file: StorageFile): Promise<Readable> {
    Logger.debug(`downloading "${file.path.nameWithExtension()}"`);

    const downloader = this.managerFactory.downloader();

    this.registerEvents(downloader, file);

    return await downloader.download(file);
  }
}
