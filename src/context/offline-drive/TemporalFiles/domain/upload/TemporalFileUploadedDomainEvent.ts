import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class TemporalFileUploadedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'offline-drive.temporal-file.uploaded';

  readonly size: number;
  readonly path: string;
  readonly replaces: string | undefined;

  constructor({
    aggregateId,
    size,
    path,
    replaces,
  }: {
    aggregateId: string;
    size: number;
    path: string;
    replaces?: string;
  }) {
    super({
      aggregateId,
      eventName: TemporalFileUploadedDomainEvent.EVENT_NAME,
    });

    this.size = size;
    this.path = path;
    this.replaces = replaces;
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      size: this.size,
      path: this.path,
      replaces: this.replaces,
    };
  }
}
