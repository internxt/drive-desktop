import { EventBus } from '../../../virtual-drive/shared/domain/EventBus';
import { OfflineContentsUploader } from '../../contents/application/OfflineContentsUploader';
import { OfflineContentsUploadedDomainEvent } from '../../contents/domain/events/OfflineContentsUploadedDomainEvent';
import { OfflineFile } from '../../files/domain/OfflineFile';
import { OfflineFilePathRetriever } from './OfflineFilePathRetriever';

export class OfflineFileUploader {
  constructor(
    private readonly offlineFilePathRetriever: OfflineFilePathRetriever,
    private readonly contentsUploader: OfflineContentsUploader,
    private readonly eventBus: EventBus
  ) {}

  async run(file: OfflineFile): Promise<void> {
    const absolutePath = await this.offlineFilePathRetriever.run(file);

    const contentsId = await this.contentsUploader.run(absolutePath);

    const contentsUploadedEvent = new OfflineContentsUploadedDomainEvent({
      aggregateId: contentsId,
      size: file.size,
      path: file.path,
    });

    await this.eventBus.publish([contentsUploadedEvent]);
  }
}
