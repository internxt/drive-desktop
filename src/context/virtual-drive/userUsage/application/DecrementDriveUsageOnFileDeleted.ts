import { FileCreatedDomainEvent } from '../../files/domain/events/FileCreatedDomainEvent';
import { DomainEventClass } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { UserUsageIncrementer } from './UserUsageIncrementer';
import { FileDeletedDomainEvent } from '../../files/domain/events/FileDeletedDomainEvent';

export class DecrementDriveUsageOnFileDeleted
  implements DomainEventSubscriber<FileCreatedDomainEvent>
{
  constructor(private readonly incrementer: UserUsageIncrementer) {}

  subscribedTo(): DomainEventClass[] {
    return [FileDeletedDomainEvent];
  }

  on(domainEvent: FileDeletedDomainEvent): Promise<void> {
    return this.incrementer.run(domainEvent.size);
  }
}
