import { Service } from 'diod';
import Logger from 'electron-log';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';
import { TemporalFilePath } from '../../domain/TemporalFilePath';
import { TemporalFileUploaderFactory } from '../../domain/upload/TemporalFileUploaderFactory';
import { TemporalFileUploadedDomainEvent } from '../../domain/upload/TemporalFileUploadedDomainEvent';
import { EventBus } from '../../../../virtual-drive/shared/domain/EventBus';
import { Replaces } from '../../domain/upload/Replaces';

@Service()
export class TemporalFileUploader {
  constructor(
    private readonly repository: TemporalFileRepository,
    private readonly uploaderFactory: TemporalFileUploaderFactory,
    private readonly eventBus: EventBus
  ) {}

  async run(path: string, replaces?: Replaces): Promise<string> {
    const documentPath = new TemporalFilePath(path);

    const documentOption = await this.repository.find(documentPath);

    if (!documentOption.isPresent()) {
      throw new Error(`Could not find ${path}`);
    }

    const document = documentOption.get();

    const stream = await this.repository.stream(documentPath);

    const controller = new AbortController();

    const stopWatching = this.repository.watchFile(documentPath, () =>
      controller.abort()
    );

    const uploader = this.uploaderFactory
      .read(stream)
      .document(document)
      .replaces(replaces)
      .abort(controller)
      .build();

    const contentsId = await uploader();

    stopWatching();

    Logger.debug(`${documentPath.value} uploaded with id ${contentsId}`);

    const contentsUploadedEvent = new TemporalFileUploadedDomainEvent({
      aggregateId: contentsId,
      size: document.size.value,
      path: document.path.value,
      replaces: replaces?.contentsId,
    });

    await this.eventBus.publish([contentsUploadedEvent]);

    return contentsId;
  }
}
