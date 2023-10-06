import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class FileRenamedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.renamed';

  readonly trackerId: string;

  constructor({
    aggregateId,
    trackerId,
  }: {
    aggregateId: string;
    trackerId: string;
  }) {
    super({
      eventName: FileRenamedDomainEvent.EVENT_NAME,
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
