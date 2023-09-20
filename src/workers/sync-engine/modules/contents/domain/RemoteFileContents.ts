import { Primitives } from 'shared/types/Primitives';
import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { ContentsId } from './ContentsId';
import { ContentsSize } from './ContentsSize';

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
    return new RemoteFileContents(id, new ContentsSize(size));
  }

  static from(attributes: RemoteFileContentsAttributes): RemoteFileContents {
    return new RemoteFileContents(
      new ContentsId(attributes.id),
      new ContentsSize(attributes.size)
    );
  }

  toPrimitives(): Record<string, Primitives> {
    return {
      contentsId: this.id,
      size: this.size,
    };
  }
}
