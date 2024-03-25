import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class OfflineContentsUploadedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'offline.contents.uploaded';

  readonly contentsId: string;
  readonly size: number;
  readonly path: string;
  readonly offlineContentsPath: string;

  constructor({
    aggregateId,
    contentsId,
    size,
    path,
    offlineContentsPath,
  }: {
    aggregateId: string;
    contentsId: string;
    size: number;
    path: string;
    offlineContentsPath: string;
  }) {
    super({
      aggregateId,
      eventName: OfflineContentsUploadedDomainEvent.EVENT_NAME,
    });

    this.contentsId = contentsId;
    this.size = size;
    this.path = path;
    this.offlineContentsPath = offlineContentsPath;
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      contentsId: this.contentsId,
      size: this.size,
      path: this.path,
      offlineContentsPath: this.offlineContentsPath,
    };
  }
}
