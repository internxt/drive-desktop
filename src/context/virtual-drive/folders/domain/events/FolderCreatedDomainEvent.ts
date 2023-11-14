import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FolderCreatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'folder.created';

  constructor({ aggregateId }: { aggregateId: string }) {
    super({
      eventName: FolderCreatedDomainEvent.EVENT_NAME,
      aggregateId,
    });
  }

  toPrimitives() {
    return {
      uuid: this.aggregateId,
    };
  }
}
