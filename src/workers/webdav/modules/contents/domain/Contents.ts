import { Readable } from 'stream';
import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { ContentsDownloadedDomainEvent } from './events/FileDownloadedDomainEvent';
import { ContentsId } from './ContentsId';

export class Contents extends AggregateRoot {
  private constructor(
    private readonly _id: ContentsId,
    public readonly stream: Readable
  ) {
    super();
  }

  public get id() {
    return this._id.value;
  }

  static from(id: ContentsId, contents: Readable): Contents {
    const remoteContents = new Contents(id, contents);

    const event = new ContentsDownloadedDomainEvent({
      aggregateId: id.value,
    });

    remoteContents.record(event);

    return remoteContents;
  }

  toPrimitives(): Record<string, string | number | boolean> {
    return {
      id: this._id.value,
    };
  }
}
