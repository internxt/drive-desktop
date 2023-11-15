import { FileCreatedDomainEvent } from '../../files/domain/events/FileCreatedDomainEvent';
import { DomainEventClass } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { UserUsageIncrementer } from './UserUsageIncrementer';

export class IncrementDriveUsageOnFileCreated
  implements DomainEventSubscriber<FileCreatedDomainEvent>
{
  constructor(private readonly incrementer: UserUsageIncrementer) {}

  subscribedTo(): DomainEventClass[] {
    return [FileCreatedDomainEvent];
  }

  on(domainEvent: FileCreatedDomainEvent): Promise<void> {
    return this.incrementer.run(domainEvent.size);
  }
}
