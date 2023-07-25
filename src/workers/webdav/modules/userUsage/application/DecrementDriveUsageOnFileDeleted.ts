import { DomainEventClass } from '../../shared/domain/WebdavDomainEvent';
import { WebdavDomainEventSubscriber } from '../../shared/domain/WebdavDomainEventSubscriber';
import { UserUsageIncrementer } from './UserUsageIncrementer';
import { FileTrashedDomainEvent } from '../../files/domain/FileTrashedDomainEvent';

export class DecrementDriveUsageOnFileDeleted
  implements WebdavDomainEventSubscriber<FileTrashedDomainEvent>
{
  constructor(private readonly incrementer: UserUsageIncrementer) {}

  subscribedTo(): DomainEventClass[] {
    return [FileTrashedDomainEvent];
  }

  on(domainEvent: FileTrashedDomainEvent): Promise<void> {
    return this.incrementer.run(domainEvent.size);
  }
}
