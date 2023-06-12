import { WebdavDomainEvent } from '../../shared/domain/WebdavDomainEvent';

export type CreatedWebdavFileDomainEventAttributes = {
  readonly size: number;
  readonly type: string;
};

export class FileCreatedDomainEvent extends WebdavDomainEvent {
  static readonly EVENT_NAME = 'file.created';

  readonly size: number;
  readonly type: string;

  constructor({
    aggregateId,
    eventId,
    size,
    type,
  }: {
    aggregateId: string;
    eventId?: string;
    size: number;
    type: string;
  }) {
    super({
      eventName: FileCreatedDomainEvent.EVENT_NAME,
      aggregateId,
      eventId,
    });
    this.size = size;
    this.type = type;
  }

  toPrimitives(): CreatedWebdavFileDomainEventAttributes {
    const { size, type } = this;

    return { size, type };
  }
}
