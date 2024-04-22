import { Service } from 'diod';
import { OfflineContentsUploadedDomainEvent } from '../../../offline-drive/contents/domain/events/OfflineContentsUploadedDomainEvent';
import { DomainEventClass } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { ContentsId } from '../domain/ContentsId';
import { LocalContentsMover } from './LocalContentsMover';

@Service()
export class MoveOfflineContentsOnContentsUploaded
  implements DomainEventSubscriber<OfflineContentsUploadedDomainEvent>
{
  constructor(private readonly mover: LocalContentsMover) {}

  subscribedTo(): DomainEventClass[] {
    return []; // Disabled because moving the contents created an error while editing some files
  }
  async on(domainEvent: OfflineContentsUploadedDomainEvent): Promise<void> {
    const contentsId = new ContentsId(domainEvent.aggregateId);

    await this.mover.run(contentsId, domainEvent.offlineContentsPath);
  }
}
