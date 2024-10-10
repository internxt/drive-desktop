import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FolderMovedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'virtual-drive.folder.moved';

  from: string;
  to: string;

  constructor({
    aggregateId,
    from,
    to,
  }: {
    aggregateId: string;
    from: string;
    to: string;
  }) {
    super({
      eventName: FolderMovedDomainEvent.EVENT_NAME,
      aggregateId,
    });

    this.from = from;
    this.to = to;
  }

  toPrimitives() {
    return {
      uuid: this.aggregateId,
      from: this.from,
      to: this.to,
    };
  }
}
