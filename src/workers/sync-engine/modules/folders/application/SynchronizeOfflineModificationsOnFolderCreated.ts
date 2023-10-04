import { DomainEventClass } from '../../shared/domain/DomainEvent';
import { WebdavDomainEventSubscriber } from '../../shared/domain/WebdavDomainEventSubscriber';
import { FolderCreatedDomainEvent } from '../domain/events/FolderCreatedDomainEvent';
import { SynchronizeOfflineModifications } from './SynchronizeOfflineModifications';

export class SynchronizeOfflineModificationsOnFolderCreated
  implements WebdavDomainEventSubscriber<FolderCreatedDomainEvent>
{
  constructor(
    private readonly synchronizeOfflineModifications: SynchronizeOfflineModifications
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [FolderCreatedDomainEvent];
  }
  async on(domainEvent: FolderCreatedDomainEvent): Promise<void> {
    await this.synchronizeOfflineModifications.run(domainEvent.aggregateId);
  }
}
