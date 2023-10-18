import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { FolderPath } from '../FolderPath';

export class FolderMovedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'folder.moved';

  private resultPath: FolderPath;

  constructor({
    aggregateId,
    resultPath,
  }: {
    aggregateId: string;
    resultPath: FolderPath;
  }) {
    super({
      eventName: FolderMovedDomainEvent.EVENT_NAME,
      aggregateId,
    });
    this.resultPath = resultPath;
  }

  toPrimitives() {
    return {
      uuid: this.aggregateId,
      resultPath: this.resultPath.value,
    };
  }
}
