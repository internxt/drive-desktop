import { OfflineContentsUploadedDomainEvent } from '../../../../offline-drive/contents/domain/events/OfflineContentsUploadedDomainEvent';
import { DomainEventClass } from '../../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../../shared/domain/DomainEventSubscriber';
import { FileCreator } from '../FileCreator';
import Logger from 'electron-log';
import { FileToOverrideProvider } from '../FileToOverrideProvider';
import { FileOverrider } from '../override/FileOverrider';

export class CreateFileOnOfflineFileUploaded
  implements DomainEventSubscriber<OfflineContentsUploadedDomainEvent>
{
  constructor(
    private readonly creator: FileCreator,
    private readonly fileToOverrideProvider: FileToOverrideProvider,
    private readonly fileOverrider: FileOverrider
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [OfflineContentsUploadedDomainEvent];
  }

  async on(event: OfflineContentsUploadedDomainEvent): Promise<void> {
    try {
      const fileToOverride = await this.fileToOverrideProvider.run();

      if (fileToOverride.isPresent()) {
        const file = fileToOverride.get();
        Logger.debug(file);
        await this.fileOverrider.run(file.uuid, event.aggregateId, event.size);
        return;
      }

      await this.creator.run(event.path, event.aggregateId, event.size);
    } catch (err) {
      Logger.error('[CreateFileOnOfflineFileUploaded]:', err);
    }
  }
}
