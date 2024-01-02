import { OfflineContentsUploadedDomainEvent } from '../../../offline-drive/contents/domain/events/OfflineContentsUploadedDomainEvent';
import { DomainEventClass } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { LocalContentsMover } from './LocalContentsMover';

export class MoveOfflineContentsOnContentsUploaded
  implements DomainEventSubscriber<OfflineContentsUploadedDomainEvent>
{
  constructor(private readonly mover: LocalContentsMover) {}

  subscribedTo(): DomainEventClass[] {
    return [OfflineContentsUploadedDomainEvent];
  }
  async on(domainEvent: OfflineContentsUploadedDomainEvent): Promise<void> {
    await this.mover.run(domainEvent.path, domainEvent.aggregateId);
  }
}
