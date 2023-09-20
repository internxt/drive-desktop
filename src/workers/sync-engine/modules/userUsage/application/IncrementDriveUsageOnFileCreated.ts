import { FileCreatedDomainEvent } from '../../files/domain/FileCreatedDomainEvent';
import { DomainEventClass } from '../../shared/domain/DomainEvent';
import { WebdavDomainEventSubscriber } from '../../shared/domain/WebdavDomainEventSubscriber';
import { UserUsageIncrementer } from './UserUsageIncrementer';

export class IncrementDriveUsageOnFileCreated
  implements WebdavDomainEventSubscriber<FileCreatedDomainEvent>
{
  constructor(private readonly incrementer: UserUsageIncrementer) {}

  subscribedTo(): DomainEventClass[] {
    return [FileCreatedDomainEvent];
  }

  on(domainEvent: FileCreatedDomainEvent): Promise<void> {
    return this.incrementer.run(domainEvent.size);
  }
}
