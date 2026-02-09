import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Readable } from 'stream';
import { DownloadProgressTracker } from '../../../../../shared/domain/DownloadProgressTracker';
import { DownloaderHandlerFactory } from '../../../domain/download/DownloaderHandlerFactory';
import { DownloaderHandler } from '../../../domain/download/DownloaderHandler';
import { StorageFile } from '../../../domain/StorageFile';

@Service()
export class StorageFileDownloader {
  constructor(
    private readonly managerFactory: DownloaderHandlerFactory,
    private readonly tracker: DownloadProgressTracker,
  ) {}

  async run(
    file: StorageFile,
    metadata: {
      name: string;
      type: string;
      size: number;
    },
  ): Promise<{ stream: Readable; metadata: typeof metadata; handler: DownloaderHandler }> {
    const downloader = this.managerFactory.downloader();

    downloader.on('error', () => this.tracker.error(metadata.name, metadata.type));

    const stream = await downloader.download(file);

    logger.debug({
      msg: `stream created "${metadata.name}.${metadata.type}" with ${file.id.value}`,
    });

    return { stream, metadata, handler: downloader };
  }
}
