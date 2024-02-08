import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class ContentsUploadedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'contents.uploaded';

  private readonly size: number;

  constructor({ aggregateId, size }: { aggregateId: string; size: number }) {
    super({
      aggregateId,
      eventName: ContentsUploadedDomainEvent.EVENT_NAME,
    });

    this.size = size;
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      size: this.size,
    };
  }
}
