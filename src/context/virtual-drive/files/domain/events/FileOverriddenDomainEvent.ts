import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FileOverriddenDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.overridden';

  readonly previousContentsId: string;
  readonly previousSize: number;

  readonly currentContentsId: string;
  readonly currentSize: number;

  constructor({
    aggregateId,
    previousContentsId,
    previousSize,
    currentContentsId,
    currentSize,
  }: {
    aggregateId: string;
    previousContentsId: string;
    previousSize: number;
    currentContentsId: string;
    currentSize: number;
  }) {
    super({
      eventName: FileOverriddenDomainEvent.EVENT_NAME,
      aggregateId,
    });

    this.previousContentsId = previousContentsId;
    this.previousSize = previousSize;

    this.currentContentsId = currentContentsId;
    this.currentSize = currentSize;
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      previousContentsId: this.previousContentsId,
      previousSize: this.previousSize,
      currentContentsId: this.currentContentsId,
      currentSize: this.currentSize,
    };
  }
}
