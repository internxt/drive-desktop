import { EventBus } from '../../../virtual-drive/shared/domain/EventBus';
import { OfflineContentsManagersFactory } from '../domain/OfflineContentsManagersFactory';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import { OfflineContentsUploadedDomainEvent } from '../domain/events/OfflineContentsUploadedDomainEvent';

export class OfflineContentsUploader {
  constructor(
    private readonly contentsManagersFactory: OfflineContentsManagersFactory,
    private readonly repository: OfflineContentsRepository,
    private readonly eventBus: EventBus
  ) {}

  // private registerEvents(
  //   uploader: ContentFileUploader,
  //   localFileContents: LocalFileContents
  // ) {
  //   uploader.on('start', () => {
  //     this.ipc.send('FILE_UPLOADING', {
  //       name: localFileContents.name,
  //       extension: localFileContents.extension,
  //       nameWithExtension: localFileContents.nameWithExtension,
  //       size: localFileContents.size,
  //       processInfo: { elapsedTime: uploader.elapsedTime() },
  //     });
  //   });

  //   uploader.on('progress', (progress: number) => {
  //     this.ipc.send('FILE_UPLOADING', {
  //       name: localFileContents.name,
  //       extension: localFileContents.extension,
  //       nameWithExtension: localFileContents.nameWithExtension,
  //       size: localFileContents.size,
  //       processInfo: { elapsedTime: uploader.elapsedTime(), progress },
  //     });
  //   });

  //   uploader.on('error', (error: Error) => {
  //     this.ipc.send('FILE_UPLOAD_ERROR', {
  //       name: localFileContents.name,
  //       extension: localFileContents.extension,
  //       nameWithExtension: localFileContents.nameWithExtension,
  //       error: error.message,
  //     });
  //   });

  //   uploader.on('finish', () => {
  //     this.ipc.send('FILE_UPLOADED', {
  //       name: localFileContents.name,
  //       extension: localFileContents.extension,
  //       nameWithExtension: localFileContents.nameWithExtension,
  //       size: localFileContents.size,
  //       processInfo: { elapsedTime: uploader.elapsedTime() },
  //     });
  //   });
  // }

  async run(absolutePath: string): Promise<string> {
    const { contents, abortSignal, size } = await this.repository.provide(
      absolutePath
    );

    const uploader = this.contentsManagersFactory.uploader(size, abortSignal);

    // this.registerEvents(uploader, contents);

    const contentsId = await uploader.upload(contents, size);

    const uploadedEvent = new OfflineContentsUploadedDomainEvent({
      aggregateId: contentsId,
      size,
      absolutePath,
    });

    await this.eventBus.publish([uploadedEvent]);

    return contentsId;
  }
}
