import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FileRenameStartedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.rename.started';

  private oldName: string;
  private nameWithExtension: string;

  constructor({
    aggregateId,
    oldName,
    nameWithExtension,
  }: {
    aggregateId: string;
    oldName: string;
    nameWithExtension: string;
  }) {
    super({
      eventName: FileRenameStartedDomainEvent.EVENT_NAME,
      aggregateId,
    });

    this.oldName = oldName;
    this.nameWithExtension = nameWithExtension;
  }

  toPrimitives() {
    return {
      contentsId: this.aggregateId,
      oldName: this.oldName,
      nameWithExtension: this.nameWithExtension,
    };
  }
}
