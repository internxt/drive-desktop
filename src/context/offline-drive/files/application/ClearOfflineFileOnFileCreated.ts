import { Service } from 'diod';
import { DomainEventClass } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { FileCreatedDomainEvent } from '../../../virtual-drive/files/domain/events/FileCreatedDomainEvent';
import { OfflineFileDeleter } from './OfflineFileDeleter';

@Service()
export class ClearOfflineFileOnFileCreated
  implements DomainEventSubscriber<FileCreatedDomainEvent>
{
  constructor(private readonly deleter: OfflineFileDeleter) {}

  subscribedTo(): DomainEventClass[] {
    return [FileCreatedDomainEvent];
  }

  async on(event: FileCreatedDomainEvent): Promise<void> {
    await this.deleter.run(event.path);
  }
}
