import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export type CreatedWebdavFileDomainEventAttributes = {
  readonly size: number;
  readonly type: string;
};

export class FileUpdatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.updated';

  readonly size: number;
  readonly type: string;
  readonly newContentsId: string;

  constructor({
    aggregateId,
    eventId,
    size,
    type,
    newContentsId,
  }: {
    aggregateId: string;
    eventId?: string;
    size: number;
    type: string;
    newContentsId: string;
  }) {
    super({
      eventName: FileUpdatedDomainEvent.EVENT_NAME,
      aggregateId,
      eventId,
    });
    this.size = size;
    this.type = type;
    this.newContentsId = newContentsId;
  }

  toPrimitives(): CreatedWebdavFileDomainEventAttributes {
    const { size, type } = this;

    return { size, type };
  }
}
