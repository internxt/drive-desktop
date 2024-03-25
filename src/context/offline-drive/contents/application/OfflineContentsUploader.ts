import { EventBus } from '../../../virtual-drive/shared/domain/EventBus';
import { OfflineContentsManagersFactory } from '../domain/OfflineContentsManagersFactory';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import { OfflineContentsUploadedDomainEvent } from '../domain/events/OfflineContentsUploadedDomainEvent';
import { FilePath } from '../../../virtual-drive/files/domain/FilePath';
import { OfflineContentsName } from '../domain/OfflineContentsName';

export class OfflineContentsUploader {
  constructor(
    private readonly repository: OfflineContentsRepository,
    private readonly contentsManagersFactory: OfflineContentsManagersFactory,
    private readonly eventBus: EventBus
  ) {}

  async run(name: OfflineContentsName, path: FilePath): Promise<string> {
    const { contents, stream, abortSignal } = await this.repository.read(name);

    const uploader = this.contentsManagersFactory.uploader(
      stream,
      contents,
      {
        name: path.name(),
        extension: path.extension(),
      },
      abortSignal
    );

    const contentsId = await uploader();

    const contentsUploadedEvent = new OfflineContentsUploadedDomainEvent({
      aggregateId: contentsId,
      offlineContentsPath: contents.absolutePath,
      size: contents.size,
      path: path.value,
    });

    await this.eventBus.publish([contentsUploadedEvent]);

    return contentsId;
  }
}
