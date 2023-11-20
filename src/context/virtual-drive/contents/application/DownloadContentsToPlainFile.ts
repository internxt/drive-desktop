import { File } from '../../files/domain/File';
import { EventBus } from '../../shared/domain/EventBus';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileWriter } from '../domain/LocalFileWriter';

export class DownloadContentsToPlainFile {
  constructor(
    private readonly managerFactory: ContentsManagersFactory,
    private readonly localWriter: LocalFileWriter,
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

    const write = await this.localWriter.write(localContents);

    const events = localContents.pullDomainEvents();
    await this.eventBus.publish(events);

    return write;
  }
}
