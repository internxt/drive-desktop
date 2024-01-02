import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class OfflineContentsUploadedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'offline.contents.uploaded';

  readonly size: number;
  readonly path: string;

  constructor({
    aggregateId,
    size,
    path,
  }: {
    aggregateId: string;
    size: number;
    path: string;
  }) {
    super({
      aggregateId,
      eventName: OfflineContentsUploadedDomainEvent.EVENT_NAME,
    });

    this.size = size;
    this.path = path;
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      size: this.size,
      path: this.path,
    };
  }
}
