import { Readable } from 'stream';
import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { ContentsId } from './ContentsId';
import { ContentsSize } from './ContentsSize';

export class Contents extends AggregateRoot {
  private constructor(
    private readonly _id: ContentsId | undefined,
    private readonly _size: ContentsSize,
    public readonly stream: Readable
  ) {
    super();
  }

  public get id(): string | undefined {
    return this._id?.value;
  }

  public get size(): number {
    return this._size.value;
  }

  static from(
    size: ContentsSize,
    contents: Readable,
    id?: ContentsId
  ): Contents {
    const remoteContents = new Contents(id, size, contents);

    return remoteContents;
  }

  toPrimitives(): Record<string, string | number | boolean | undefined> {
    return {
      id: this.id,
      size: this.size,
    };
  }
}
