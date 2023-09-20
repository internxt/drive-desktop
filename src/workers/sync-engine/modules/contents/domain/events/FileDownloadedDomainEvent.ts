import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class ContentsDownloadedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: 'contents.downloaded';

  constructor({
    aggregateId,
    eventId,
  }: {
    aggregateId: string;
    eventId?: string;
  }) {
    super({
      eventName: 'contents.downloaded',
      aggregateId,
      eventId,
    });
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      eventId: this.eventId,
    };
  }
}
