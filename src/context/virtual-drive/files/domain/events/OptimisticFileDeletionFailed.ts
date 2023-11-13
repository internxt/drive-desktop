import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class OptimisticFileDeletionFailed extends DomainEvent {
  static readonly EVENT_NAME = 'file.deletion.failed';

  constructor({ aggregateId }: { aggregateId: string }) {
    super({
      eventName: OptimisticFileDeletionFailed.EVENT_NAME,
      aggregateId,
    });
  }

  toPrimitives() {
    return {
      contentsId: this.aggregateId,
    };
  }
}
