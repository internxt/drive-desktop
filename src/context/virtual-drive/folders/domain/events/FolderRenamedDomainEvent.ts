import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FolderRenamedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'folder.renamed';

  previousPath: string;
  nextPath: string;

  constructor({
    aggregateId,
    previousPath: previousName,
    nextPath: nextName,
  }: {
    aggregateId: string;
    previousPath: string;
    nextPath: string;
  }) {
    super({
      eventName: FolderRenamedDomainEvent.EVENT_NAME,
      aggregateId,
    });

    this.previousPath = previousName;
    this.nextPath = nextName;
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      previousPath: this.previousPath,
      nextPath: this.nextPath,
    };
  }
}
