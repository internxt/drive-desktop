import { DomainEvent } from '../../../shared/domain/DomainEvent';

type DeleteWebdavFileDomainEventAttributes = {
  readonly size: number;
};

export class FileDeletedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.deleted';

  readonly size: number;

  constructor({
    aggregateId,
    eventId,
    size,
  }: {
    aggregateId: string;
    eventId?: string;
    size: number;
  }) {
    super({
      eventName: FileDeletedDomainEvent.EVENT_NAME,
      aggregateId,
      eventId,
    });
    this.size = size;
  }

  toPrimitives(): DeleteWebdavFileDomainEventAttributes {
    const { size } = this;
    return { size };
  }
}
