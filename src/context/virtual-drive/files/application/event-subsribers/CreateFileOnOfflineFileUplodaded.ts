import { OfflineContentsUploadedDomainEvent } from '../../../../offline-drive/contents/domain/events/OfflineContentsUploadedDomainEvent';
import { DomainEventClass } from '../../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../../shared/domain/DomainEventSubscriber';
import { FilePath } from '../../domain/FilePath';
import { FileCreator } from '../FileCreator';
import Logger from 'electron-log';
import { FileToOverrideProvider } from '../FileToOverrideProvider';

export class CreateFileOnOfflineFileUploaded
  implements DomainEventSubscriber<OfflineContentsUploadedDomainEvent>
{
  constructor(
    private readonly creator: FileCreator,
    private readonly fileToOverrideProvider: FileToOverrideProvider
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [OfflineContentsUploadedDomainEvent];
  }

  async on(event: OfflineContentsUploadedDomainEvent): Promise<void> {
    try {
      const fileToOverride = await this.fileToOverrideProvider.run();

      if (fileToOverride.isPresent()) {
        Logger.debug('!!!!!!!!!!!!!!!!!!!!');
        Logger.debug('IT SHOULD OVERRIDE:', fileToOverride.get());
        return;
      }

      const filePath = new FilePath(event.path);
      await this.creator.run(filePath, event.aggregateId, event.size);
    } catch (err) {
      Logger.error('[CreateFileOnOfflineFileUploaded]:', err);
    }
  }
}
