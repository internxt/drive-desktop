import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { EventBus } from '../../shared/domain/EventBus';
import { ContentsManagersFactory } from '../domain/ContentsManagersFactory';
import { UploadProgressTracker } from '../../../shared/domain/UploadProgressTracker';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalContentsProvider } from '../domain/LocalFileProvider';
import { RemoteFileContents } from '../domain/RemoteFileContents';
import { ContentFileUploader } from '../domain/contentHandlers/ContentFileUploader';

export class ContentsUploader {
  constructor(
    private readonly remoteContentsManagersFactory: ContentsManagersFactory,
    private readonly contentProvider: LocalContentsProvider,
    private readonly relativePathToAbsoluteConverter: RelativePathToAbsoluteConverter,
    private readonly eventBus: EventBus,
    private readonly notifier: UploadProgressTracker
  ) {}

  private registerEvents(
    uploader: ContentFileUploader,
    localFileContents: LocalFileContents
  ) {
    uploader.on('start', () => {
      this.notifier.uploadStarted(
        localFileContents.name,
        localFileContents.extension,
        localFileContents.size
      );
    });

    uploader.on('progress', (progress: number) => {
      this.notifier.uploadProgress(
        localFileContents.name,
        localFileContents.extension,
        localFileContents.size,
        { elapsedTime: uploader.elapsedTime(), percentage: progress }
      );
    });

    uploader.on('error', (_error: Error) => {
      // TODO: use error to define the cause of the error
      this.notifier.uploadError(
        localFileContents.name,
        localFileContents.extension,
        'UNKNOWN'
      );
    });

    uploader.on('finish', () => {
      this.notifier.uploadCompleted(
        localFileContents.name,
        localFileContents.extension,
        localFileContents.size,
        { elapsedTime: uploader.elapsedTime() }
      );
    });
  }

  async run(posixRelativePath: string): Promise<RemoteFileContents> {
    const win32RelativePath =
      PlatformPathConverter.posixToWin(posixRelativePath);

    const absolutePath =
      this.relativePathToAbsoluteConverter.run(win32RelativePath);

    const { contents, abortSignal } = await this.contentProvider.provide(
      absolutePath
    );

    const uploader = this.remoteContentsManagersFactory.uploader(
      contents,
      abortSignal
    );

    this.registerEvents(uploader, contents);

    const contentsId = await uploader.upload(contents.stream, contents.size);

    const fileContents = RemoteFileContents.create(contentsId, contents.size);

    await this.eventBus.publish(fileContents.pullDomainEvents());

    return fileContents;
  }
}
