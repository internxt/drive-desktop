import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class ContentsAccededDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'contents.acceded';

  readonly path: string;

  constructor({ aggregateId, path }: { aggregateId: string; path: string }) {
    super({
      eventName: ContentsAccededDomainEvent.EVENT_NAME,
      aggregateId,
    });

    this.path = path;
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      eventId: this.eventId,
      path: this.path,
    };
  }
}
