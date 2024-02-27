import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class OfflineFileUploaded extends DomainEvent {
  static readonly EVENT_NAME = 'offline.file.uploaded';

  readonly remoteContentsId: string;
  readonly size: number;
  readonly createdAt: number;

  constructor({
    aggregateId,
    remoteContentsId,
    size,
    createdAt,
  }: {
    aggregateId: string;
    remoteContentsId: string;
    size: number;
    createdAt: number;
  }) {
    super({
      aggregateId,
      eventName: OfflineFileUploaded.EVENT_NAME,
    });

    this.remoteContentsId = remoteContentsId;
    this.size = size;
    this.createdAt = createdAt;
  }

  toPrimitives() {
    return {
      aggregateId: this.aggregateId,
      remoteContentsId: this.remoteContentsId,
      size: this.size,
      createdAt: this.createdAt,
    };
  }
}
