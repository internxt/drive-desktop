import { OfflineContentsUploadedDomainEvent } from '../../../offline-drive/contents/domain/events/OfflineContentsUploadedDomainEvent';
import { DomainEventClass } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { AbsolutePathToRelativeConverter } from '../../shared/application/AbsolutePathToRelativeConverter';
import { FileCreator } from './FileCreator';

export class CreateFileOnOfflineFileUploaded
  implements DomainEventSubscriber<OfflineContentsUploadedDomainEvent>
{
  constructor(
    private readonly creator: FileCreator,
    private readonly converter: AbsolutePathToRelativeConverter
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [OfflineContentsUploadedDomainEvent];
  }

  async on(event: OfflineContentsUploadedDomainEvent): Promise<void> {
    const filePath = this.converter.run(event.absolutePath);

    await this.creator.run(filePath, event.aggregateId, event.size);
  }
}
