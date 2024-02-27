import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FileRenameFailedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.rename.failed';

  private name: string;
  private extension: string;
  private nameWithExtension: string;
  private error: string;

  constructor({
    aggregateId,
    name,
    extension,
    nameWithExtension,
    error,
  }: {
    aggregateId: string;
    name: string;
    extension: string;
    nameWithExtension: string;
    error: string;
  }) {
    super({
      eventName: FileRenameFailedDomainEvent.EVENT_NAME,
      aggregateId,
    });

    this.name = name;
    this.extension = extension;
    this.nameWithExtension = nameWithExtension;
    this.error = error;
  }

  toPrimitives() {
    return {
      contentsId: this.aggregateId,
      name: this.name,
      extension: this.extension,
      nameWithExtension: this.nameWithExtension,
      error: this.error,
    };
  }
}
