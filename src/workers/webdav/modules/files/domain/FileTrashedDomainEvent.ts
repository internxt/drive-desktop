import { WebdavDomainEvent } from '../../shared/domain/WebdavDomainEvent';

type DeleteWebdavFileDomainEventAttributes = {
  readonly size: number;
};

export class FileTrashedDomainEvent extends WebdavDomainEvent {
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
      eventName: FileTrashedDomainEvent.EVENT_NAME,
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
