import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { ContentsId } from './ContentsId';
import { ContentsSize } from './ContentsSize';
import { ContentsUploadedDomainEvent } from './events/ContentsUploadedDomainEvent';

export type RemoteFileContentsAttributes = {
  id: string;
  size: number;
};

export class RemoteFileContents extends AggregateRoot {
  private constructor(
    private readonly _id: ContentsId,
    private readonly _size: ContentsSize
  ) {
    super();
  }

  public get id(): string {
    return this._id.value;
  }

  public get size(): number {
    return this._size.value;
  }

  static create(id: ContentsId, size: number): RemoteFileContents {
    const contents = new RemoteFileContents(id, new ContentsSize(size));

    contents.record(
      new ContentsUploadedDomainEvent({ aggregateId: contents.id, size })
    );

    return contents;
  }

  static from(attributes: RemoteFileContentsAttributes): RemoteFileContents {
    return new RemoteFileContents(
      new ContentsId(attributes.id),
      new ContentsSize(attributes.size)
    );
  }

  attributes() {
    return {
      contentsId: this.id,
      size: this.size,
    };
  }
}
