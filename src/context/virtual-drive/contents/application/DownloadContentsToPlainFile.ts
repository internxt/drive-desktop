import { File } from '../../files/domain/File';
import { EventBus } from '../../shared/domain/EventBus';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileSystem } from '../domain/LocalFileSystem';

export class DownloadContentsToPlainFile {
  constructor(
    private readonly managerFactory: ContentsManagersFactory,
    private readonly localWriter: LocalFileSystem,
    private readonly eventBus: EventBus
  ) {}

  async run(file: File): Promise<string> {
    const downloader = this.managerFactory.downloader();

    const readable = await downloader.download(file);
    const localContents = LocalFileContents.downloadedFrom(
      file,
      readable,
      downloader.elapsedTime()
    );

    const write = await this.localWriter.write(localContents, file.contentsId);

    const events = localContents.pullDomainEvents();
    await this.eventBus.publish(events);

    return write;
  }
}
