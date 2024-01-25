import { DomainEventClass } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { FileCreatedDomainEvent } from '../../../virtual-drive/files/domain/events/FileCreatedDomainEvent';
import { FileDeletedDomainEvent } from '../../../virtual-drive/files/domain/events/FileDeletedDomainEvent';
import { UserUsageDecrementor } from './UserUsageDecrementor';

export class DecrementDriveUsageOnFileDeleted
  implements DomainEventSubscriber<FileCreatedDomainEvent>
{
  constructor(private readonly decrementor: UserUsageDecrementor) {}

  subscribedTo(): DomainEventClass[] {
    return [FileDeletedDomainEvent];
  }

  on(domainEvent: FileDeletedDomainEvent): Promise<void> {
    return this.decrementor.run(domainEvent.size);
  }
}
