import { Service } from 'diod';
import Logger from 'electron-log';
import { Readable } from 'stream';
import { DownloadProgressTracker } from '../../../../../shared/domain/DownloadProgressTracker';
import { DownloaderHandlerFactory } from '../../../domain/download/DownloaderHandlerFactory';
import { DownloaderHandler } from '../../../domain/download/DownloaderHandler';
import { StorageFile } from '../../../domain/StorageFile';

@Service()
export class StorageFileDownloader {
  constructor(
    private readonly managerFactory: DownloaderHandlerFactory,
    private readonly tracker: DownloadProgressTracker
  ) {}

  private async registerEvents(
    handler: DownloaderHandler,
    { name, type, size }: { name: string; type: string; size: number }
  ) {
    handler.on('start', () => {
      this.tracker.downloadStarted(name, type, size);
    });

    handler.on('progress', (progress: number, elapsedTime: number) => {
      this.tracker.downloadUpdate(name, type, {
        elapsedTime,
        percentage: progress,
      });
    });

    handler.on('error', () => {
      this.tracker.error(name, type);
    });

    handler.on('finish', () => {
      this.tracker.downloadFinished(name, type, size, {
        elapsedTime: handler.elapsedTime(),
      });
    });
  }

  async run(
    file: StorageFile,
    metadata: {
      name: string;
      type: string;
      size: number;
    }
  ): Promise<Readable> {
    const downloader = this.managerFactory.downloader();

    await this.registerEvents(downloader, metadata);

    const stream = await downloader.download(file);

    Logger.debug(
      `stream created "${metadata.name}.${metadata.type}" with ${file.id.value}`
    );

    return stream;
  }
}
