import { DownloadProgressTracker } from '../../../shared/domain/DownloadProgressTracker';
import { File } from '../../files/domain/File';
import { EventBus } from '../../shared/domain/EventBus';
import { ContentsId } from '../domain/ContentsId';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileSystem } from '../domain/LocalFileSystem';
import { ContentFileDownloader } from '../domain/contentHandlers/ContentFileDownloader';
import Logger from 'electron-log';

export class DownloadContentsToPlainFile {
  constructor(
    private readonly managerFactory: ContentsManagersFactory,
    private readonly local: LocalFileSystem,
    private readonly eventBus: EventBus,
    private readonly tracker: DownloadProgressTracker
  ) {}

  private async registerEvents(downloader: ContentFileDownloader, file: File) {
    downloader.on('start', () => {
      this.tracker.downloadStarted(file.name, file.type, file.size);
    });

    downloader.on('progress', (progress: number, elapsedTime: number) => {
      this.tracker.downloadUpdate(file.name, file.type, {
        elapsedTime,
        percentage: progress,
      });
    });

    downloader.on('error', () => {
      this.tracker.error(file.name, file.type);
    });

    downloader.on('finish', (elapsedTime: number) => {
      this.tracker.downloadFinished(file.name, file.type, file.size, {
        elapsedTime,
      });
    });
  }

  async run(file: File): Promise<void> {
    const contentsId = new ContentsId(file.contentsId);

    const metadata = await this.local.metadata(contentsId);

    if (metadata) {
      if (metadata.isUpToDate(file.updatedAt)) {
        return;
      }
    }

    Logger.debug(`downloading "${file.nameWithExtension}"`);

    const downloader = this.managerFactory.downloader();

    this.registerEvents(downloader, file);

    const readable = await downloader.download(file);
    const localContents = LocalFileContents.downloadedFrom(
      file,
      readable,
      downloader.elapsedTime()
    );

    await this.local.write(localContents, file.contentsId);

    const events = localContents.pullDomainEvents();
    await this.eventBus.publish(events);
  }
}
