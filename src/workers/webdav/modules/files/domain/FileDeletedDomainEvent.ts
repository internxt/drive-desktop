import { WebdavDomainEvent } from '../../shared/domain/WebdavDomainEvent';

type DeleteWebdavFileDomainEventAttributes = Record<string, never>;

export class FileDeletedDomainEvent extends WebdavDomainEvent {
  static readonly EVENT_NAME = 'file.deleted';

  constructor({
    aggregateId,
    eventId,
  }: {
    aggregateId: string;
    eventId?: string;
  }) {
    super({
      eventName: FileDeletedDomainEvent.EVENT_NAME,
      aggregateId,
      eventId,
    });
  }

  toPrimitives(): DeleteWebdavFileDomainEventAttributes {
    return {};
  }
}
