import { Service } from 'diod';
import Logger from 'electron-log';
import { TemporalFileUploadedDomainEvent } from '../../../../offline-drive/TemporalFiles/domain/upload/TemporalFileUploadedDomainEvent';
import { DomainEventClass } from '../../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../../shared/domain/DomainEventSubscriber';
import { FileCreator } from './FileCreator';
import { FileOverrider } from '../override/FileOverrider';

@Service()
export class CreateFileOnTemporalFileUploaded
  implements DomainEventSubscriber<TemporalFileUploadedDomainEvent>
{
  constructor(
    private readonly creator: FileCreator,
    private readonly fileOverrider: FileOverrider
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [TemporalFileUploadedDomainEvent, TemporalFileUploadedDomainEvent];
  }

  private async create(event: TemporalFileUploadedDomainEvent): Promise<void> {
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

  async on(event: TemporalFileUploadedDomainEvent): Promise<void> {
    try {
      this.create(event);
    } catch (err) {
      Logger.error('[CreateFileOnOfflineFileUploaded]:', err);
    }
  }
}
