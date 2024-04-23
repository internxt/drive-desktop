import { Service } from 'diod';
import Logger from 'electron-log';
import { Readable } from 'stream';
import { DownloadProgressTracker } from '../../../../shared/domain/DownloadProgressTracker';
import { File } from '../../domain/File';
import { FileDownloaderHandler } from '../../domain/download/FileDownloaderHandler';
import { FileDownloaderHandlerFactory } from '../../domain/download/FileDownloaderHandlerFactory';

@Service()
export class FileDownloader {
  constructor(
    private readonly managerFactory: FileDownloaderHandlerFactory,
    private readonly tracker: DownloadProgressTracker
  ) {}

  private async registerEvents(handler: FileDownloaderHandler, file: File) {
    handler.on('start', () => {
      this.tracker.downloadStarted(file.name, file.type, file.size);
    });

    handler.on('progress', (progress: number, elapsedTime: number) => {
      this.tracker.downloadUpdate(file.name, file.type, {
        elapsedTime,
        percentage: progress,
      });
    });

    handler.on('error', () => {
      this.tracker.error(file.name, file.type);
    });
  }

  async run(file: File): Promise<Readable> {
    Logger.debug(`downloading "${file.nameWithExtension}"`);

    const downloader = this.managerFactory.downloader();

    this.registerEvents(downloader, file);

    return await downloader.download(file);
  }
}
