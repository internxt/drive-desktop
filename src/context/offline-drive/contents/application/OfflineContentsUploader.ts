import { EventBus } from '../../../virtual-drive/shared/domain/EventBus';
import { OfflineContentsManagersFactory } from '../domain/OfflineContentsManagersFactory';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import { OfflineContentsUploadedDomainEvent } from '../domain/events/OfflineContentsUploadedDomainEvent';
import { FilePath } from '../../../virtual-drive/files/domain/FilePath';
import { OfflineContentsName } from '../domain/OfflineContentsName';
import Logger from 'electron-log';

export class OfflineContentsUploader {
  constructor(
    private readonly repository: OfflineContentsRepository,
    private readonly contentsManagersFactory: OfflineContentsManagersFactory,
    private readonly eventBus: EventBus
  ) {}

  async run(
    name: OfflineContentsName,
    path: FilePath,
    replaces?: string
  ): Promise<string> {
    const { contents, stream, abortSignal } =
      await this.repository.createStream(name);

    const uploader = this.contentsManagersFactory.uploader(
      stream,
      contents,
      {
        name: path.name(),
        extension: path.extension(),
      },
      abortSignal
    );

    const contentsId = await uploader();

    Logger.debug(`${path.value} uploaded with id ${contentsId}`);

    const contentsUploadedEvent = new OfflineContentsUploadedDomainEvent({
      aggregateId: contentsId,
      offlineContentsPath: contents.absolutePath,
      size: contents.size,
      path: path.value,
      replaces,
    });

    await this.eventBus.publish([contentsUploadedEvent]);

    return contentsId;
  }
}
