import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FolderRenameStartedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.rename.started';

  private oldName: string;
  private newName: string;

  constructor({
    aggregateId,
    oldName,
    newName,
  }: {
    aggregateId: string;
    oldName: string;
    newName: string;
  }) {
    super({
      eventName: FolderRenameStartedDomainEvent.EVENT_NAME,
      aggregateId,
    });

    this.oldName = oldName;
    this.newName = newName;
  }

  toPrimitives() {
    return {
      contentsId: this.aggregateId,
      oldName: this.oldName,
      newName: this.newName,
    };
  }
}
