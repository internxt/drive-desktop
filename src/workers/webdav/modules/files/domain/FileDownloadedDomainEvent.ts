import { WebdavDomainEvent } from '../../shared/domain/WebdavDomainEvent';
type DownloadWebdavFileDomainEventAttributes = {
  readonly size: number;
  readonly type: string;
};

export class FileDownloadedDomainEvent extends WebdavDomainEvent {
  static readonly EVENT_NAME: 'file.downloaded';

  readonly size: number;
  readonly type: string;

  constructor({
    aggregateId,
    eventId,
    size,
    type,
  }: {
    aggregateId: string;
    eventId?: string;
    size: number;
    type: string;
  }) {
    super({
      eventName: 'file.downloaded',
      aggregateId,
      eventId,
    });
    this.size = size;
    this.type = type;
  }

  toPrimitives(): DownloadWebdavFileDomainEventAttributes {
    return {
      size: this.size,
      type: this.type,
    };
  }
}
