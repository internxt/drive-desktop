import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FileRenamedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.renamed';

  constructor({ aggregateId }: { aggregateId: string }) {
    super({
      eventName: FileRenamedDomainEvent.EVENT_NAME,
      aggregateId,
    });
  }

  toPrimitives() {
    return {
      contentsId: this.aggregateId,
    };
  }
}
