import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class OfflineContentsUploadedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'offline.contents.uploaded';

  readonly size: number;
  readonly absolutePath: string;

  constructor({
    aggregateId,
    size,
    absolutePath,
  }: {
    aggregateId: string;
    size: number;
    absolutePath: string;
  }) {
    super({
      aggregateId,
      eventName: OfflineContentsUploadedDomainEvent.EVENT_NAME,
    });

    this.size = size;
    this.absolutePath = absolutePath;
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      size: this.size,
      absolutePath: this.absolutePath,
    };
  }
}
