import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export type CreatedWebdavFileDomainEventAttributes = {
  readonly size: number;
  readonly type: string;
  readonly path: string;
};

export class FileCreatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.created';

  readonly size: number;
  readonly type: string;
  readonly path: string;

  constructor({
    aggregateId,
    eventId,
    size,
    type,
    path,
  }: {
    aggregateId: string;
    eventId?: string;
    size: number;
    type: string;
    path: string;
  }) {
    super({
      eventName: FileCreatedDomainEvent.EVENT_NAME,
      aggregateId,
      eventId,
    });
    this.size = size;
    this.type = type;
    this.path = path;
  }

  toPrimitives(): CreatedWebdavFileDomainEventAttributes {
    const { size, type, path } = this;

    return { size, type, path };
  }
}
