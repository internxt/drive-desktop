import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class ContentsDownloadedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'contents.downloaded';

  readonly name: string;
  readonly extension: string;
  readonly nameWithExtension: string;
  readonly size: number;
  readonly elapsedTime: number;

  constructor({
    aggregateId,
    eventId,
    name,
    extension,
    nameWithExtension,
    size,
    elapsedTime,
  }: {
    aggregateId: string;
    name: string;
    extension: string;
    nameWithExtension: string;
    size: number;
    elapsedTime: number;
    eventId?: string;
  }) {
    super({
      eventName: 'contents.downloaded',
      aggregateId,
      eventId,
    });

    this.name = name;
    this.extension = extension;
    this.nameWithExtension = nameWithExtension;
    this.size = size;
    this.elapsedTime = elapsedTime;
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      eventId: this.eventId,
      name: this.name,
      extension: this.extension,
      nameWithExtension: this.nameWithExtension,
      size: this.size,
      elapsedTime: this.elapsedTime,
    };
  }
}
