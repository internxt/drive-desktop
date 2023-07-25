import { DomainEventClass } from '../../../shared/domain/WebdavDomainEvent';
import { WebdavDomainEventSubscriber } from '../../../shared/domain/WebdavDomainEventSubscriber';
import { FileTrashedDomainEvent } from '../../domain/FileTrashedDomainEvent';
import { CachedFileContentsDeleter } from './CachedFileContentsDeleter';

export class DeleteCachedFileOnFileTrashed
  implements WebdavDomainEventSubscriber<FileTrashedDomainEvent>
{
  constructor(private readonly deleter: CachedFileContentsDeleter) {}

  subscribedTo(): DomainEventClass[] {
    return [FileTrashedDomainEvent];
  }

  on(domainEvent: FileTrashedDomainEvent): Promise<void> {
    return this.deleter.run(domainEvent.aggregateId);
  }
}
