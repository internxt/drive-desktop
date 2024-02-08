import { OfflineContentsUploadedDomainEvent } from '../../../offline-drive/contents/domain/events/OfflineContentsUploadedDomainEvent';
import { DomainEventClass } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { FileCreator } from './FileCreator';

export class CreateFileOnOfflineFileUploaded
  implements DomainEventSubscriber<OfflineContentsUploadedDomainEvent>
{
  constructor(private readonly creator: FileCreator) {}

  subscribedTo(): DomainEventClass[] {
    return [OfflineContentsUploadedDomainEvent];
  }

  async on(event: OfflineContentsUploadedDomainEvent): Promise<void> {
    await this.creator.run(event.path, event.aggregateId, event.size);
  }
}
