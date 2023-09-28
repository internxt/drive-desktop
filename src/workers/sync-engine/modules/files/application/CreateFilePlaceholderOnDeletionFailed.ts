import { DomainEventClass } from '../../shared/domain/DomainEvent';
import { WebdavDomainEventSubscriber } from '../../shared/domain/WebdavDomainEventSubscriber';
import { OptimisticFileDeletionFailed } from '../domain/events/OptimisticFileDeletionFailed';
import { FilePlaceholderCreatorFromContentsId } from './FilePlaceholderCreatorFromContentsId';

export class CreateFilePlaceholderOnDeletionFailed
  implements WebdavDomainEventSubscriber<OptimisticFileDeletionFailed>
{
  constructor(private readonly creator: FilePlaceholderCreatorFromContentsId) {}

  subscribedTo(): DomainEventClass[] {
    return [OptimisticFileDeletionFailed];
  }

  async on(domainEvent: OptimisticFileDeletionFailed): Promise<void> {
    this.creator.run(domainEvent.toPrimitives().contentsId);
  }
}
