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
      this.tracker.downloadStarted(file.nameWithExtension);
    });

    downloader.on('progress', (progress: number) => {
      this.tracker.downloadUpdate(file.nameWithExtension, progress);
    });

    downloader.on('error', () => {
      this.tracker.error(file.nameWithExtension);
    });

    downloader.on('finish', () => {
      this.tracker.downloadFinished(file.nameWithExtension);
    });
  }

  async run(file: File): Promise<void> {
    const contentsId = new ContentsId(file.contentsId);

    const alreadyInLocal = await this.local.exists(contentsId);
    if (alreadyInLocal) {
      return;
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
