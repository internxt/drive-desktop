import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FileMovedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.moved';

  constructor({ aggregateId }: { aggregateId: string }) {
    super({
      eventName: FileMovedDomainEvent.EVENT_NAME,
      aggregateId,
    });
  }

  toPrimitives() {
    return {
      contentsId: this.aggregateId,
    };
  }
}
