import { DomainEventClass } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { FileCreatedDomainEvent } from '../../../virtual-drive/files/domain/events/FileCreatedDomainEvent';
import { UserUsageIncrementor } from './UserUsageIncrementor';

export class IncrementDriveUsageOnFileCreated
  implements DomainEventSubscriber<FileCreatedDomainEvent>
{
  constructor(private readonly incrementor: UserUsageIncrementor) {}

  subscribedTo(): DomainEventClass[] {
    return [FileCreatedDomainEvent];
  }

  on(domainEvent: FileCreatedDomainEvent): Promise<void> {
    return this.incrementor.run(domainEvent.size);
  }
}
