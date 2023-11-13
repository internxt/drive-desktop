import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FileMovedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.moved';

  readonly trackerId: string;

  constructor({
    aggregateId,
    trackerId,
  }: {
    aggregateId: string;
    trackerId: string;
  }) {
    super({
      eventName: FileMovedDomainEvent.EVENT_NAME,
      aggregateId,
    });

    this.trackerId = trackerId;
  }

  toPrimitives() {
    return {
      contentsId: this.aggregateId,
      trackerId: this.trackerId,
    };
  }
}
