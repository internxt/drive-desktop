import Logger from 'electron-log';
import { OfflineContentsUploadedDomainEvent } from '../../../../offline-drive/contents/domain/events/OfflineContentsUploadedDomainEvent';
import { DomainEventClass } from '../../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../../shared/domain/DomainEventSubscriber';
import { FileCreator } from '../FileCreator';
import { FileOverrider } from '../override/FileOverrider';

export class CreateFileOnOfflineFileUploaded
  implements DomainEventSubscriber<OfflineContentsUploadedDomainEvent>
{
  constructor(
    private readonly creator: FileCreator,
    private readonly fileOverrider: FileOverrider
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [OfflineContentsUploadedDomainEvent];
  }

  private async create(
    event: OfflineContentsUploadedDomainEvent
  ): Promise<void> {
    if (event.replaces) {
      await this.fileOverrider.run(
        event.replaces,
        event.aggregateId,
        event.size
      );
      return;
    }

    await this.creator.run(event.path, event.aggregateId, event.size);
  }

  async on(event: OfflineContentsUploadedDomainEvent): Promise<void> {
    try {
      this.create(event);
    } catch (err) {
      Logger.error('[CreateFileOnOfflineFileUploaded]:', err);
    }
  }
}
