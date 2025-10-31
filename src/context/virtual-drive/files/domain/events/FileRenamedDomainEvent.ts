import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FileRenamedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.renamed';

  private oldName: string;

  constructor({ aggregateId, oldName }: { aggregateId: string; oldName: string }) {
    super({
      eventName: FileRenamedDomainEvent.EVENT_NAME,
      aggregateId,
    });

    this.oldName = oldName;
  }

  toPrimitives() {
    return {
      contentsId: this.aggregateId,
      oldName: this.oldName,
    };
  }
}
