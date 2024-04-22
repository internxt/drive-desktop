import { Service } from 'diod';
import { DomainEventClass } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { FolderCreatedDomainEvent } from '../domain/events/FolderCreatedDomainEvent';
import { SynchronizeOfflineModifications } from './SynchronizeOfflineModifications';

@Service()
export class SynchronizeOfflineModificationsOnFolderCreated
  implements DomainEventSubscriber<FolderCreatedDomainEvent>
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
