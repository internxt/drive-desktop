import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class FileUpdateContentDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'file.update.content';

  readonly size: number;
  readonly contentId: string;

  constructor({
    aggregateId,
    eventId,
    size,
    contentId,
  }: {
    aggregateId: string;
    eventId?: string;
    size: number;
    contentId: string;
  }) {
    super({
      eventName: FileUpdateContentDomainEvent.EVENT_NAME,
      aggregateId,
      eventId,
    });
    this.size = size;
    this.contentId = contentId;
  }

  toPrimitives() {
    const { size, contentId } = this;

    return { size, contentId };
  }
}
