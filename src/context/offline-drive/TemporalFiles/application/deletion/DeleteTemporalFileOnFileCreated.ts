import { Service } from 'diod';
import { DomainEventClass } from '../../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../../shared/domain/DomainEventSubscriber';
import { FileCreatedDomainEvent } from '../../../../virtual-drive/files/domain/events/FileCreatedDomainEvent';
import { TemporalFileDeleter } from './TemporalFileDeleter';

@Service()
export class DeleteTemporalFileOnFileCreated
  implements DomainEventSubscriber<FileCreatedDomainEvent>
{
  constructor(private readonly deleter: TemporalFileDeleter) {}

  subscribedTo(): DomainEventClass[] {
    return [FileCreatedDomainEvent];
  }

  async on(event: FileCreatedDomainEvent): Promise<void> {
    await this.deleter.run(event.path);
  }
}
