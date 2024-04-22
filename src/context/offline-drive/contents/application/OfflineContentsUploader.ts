import { Service } from 'diod';
import Logger from 'electron-log';
import { FilePath } from '../../../virtual-drive/files/domain/FilePath';
import { EventBus } from '../../../virtual-drive/shared/domain/EventBus';
import { OfflineContentsManagersFactory } from '../domain/OfflineContentsManagersFactory';
import { OfflineContentsName } from '../domain/OfflineContentsName';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import { OfflineContentsUploadedDomainEvent } from '../domain/events/OfflineContentsUploadedDomainEvent';

interface Replaces {
  contentsId: string;
  name: string;
  extension: string;
}

@Service()
export class OfflineContentsUploader {
  constructor(
    private readonly repository: OfflineContentsRepository,
    private readonly contentsManagersFactory: OfflineContentsManagersFactory,
    private readonly eventBus: EventBus
  ) {}

  async run(
    name: OfflineContentsName,
    path: FilePath,
    replaces?: Replaces
  ): Promise<string> {
    const { contents, stream, abortSignal } =
      await this.repository.createStream(name);

    const uploader = this.contentsManagersFactory.uploader(
      stream,
      contents,
      {
        name: replaces?.name || path.name(),
        extension: replaces?.extension || path.extension(),
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
      replaces: replaces?.contentsId,
    });

    await this.eventBus.publish([contentsUploadedEvent]);

    return contentsId;
  }
}
