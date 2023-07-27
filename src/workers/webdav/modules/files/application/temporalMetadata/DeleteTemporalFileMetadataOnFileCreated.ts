import { DomainEventClass } from '../../../shared/domain/WebdavDomainEvent';
import { WebdavDomainEventSubscriber } from '../../../shared/domain/WebdavDomainEventSubscriber';
import { FileCreatedDomainEvent } from '../../domain/FileCreatedDomainEvent';
import { TemporalFileMetadataDeleter } from './TemporalFileMetadataDeleter';

export class DeleteTemporalFileMetadataOnFileCreated
  implements WebdavDomainEventSubscriber<FileCreatedDomainEvent>
{
  constructor(private readonly deleter: TemporalFileMetadataDeleter) {}

  subscribedTo(): DomainEventClass[] {
    return [FileCreatedDomainEvent];
  }

  async on(domainEvent: FileCreatedDomainEvent): Promise<void> {
    this.deleter.run(domainEvent.path);
  }
}
