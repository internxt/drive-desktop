import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class OfflineContentsUploadedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'offline.contents.uploaded';

  readonly size: number;
  readonly path: string;
  readonly offlineContentsPath: string;

  constructor({
    aggregateId,
    size,
    path,
    offlineContentsPath,
  }: {
    aggregateId: string;
    size: number;
    path: string;
    offlineContentsPath: string;
  }) {
    super({
      aggregateId,
      eventName: OfflineContentsUploadedDomainEvent.EVENT_NAME,
    });

    this.size = size;
    this.path = path;
    this.offlineContentsPath = offlineContentsPath;
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      size: this.size,
      path: this.path,
      offlineContentsPath: this.offlineContentsPath,
    };
  }
}
