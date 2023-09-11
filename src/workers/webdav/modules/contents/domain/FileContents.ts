import { Primitives } from 'shared/types/Primitives';
import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { ContentsId } from './ContentsId';
import { ContentsSize } from './ContentsSize';

export class FileContents extends AggregateRoot {
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

  static create(id: ContentsId, size: number): FileContents {
    return new FileContents(id, new ContentsSize(size));
  }

  static from(id: ContentsId, size: ContentsSize): FileContents {
    return new FileContents(id, size);
  }

  toPrimitives(): Record<string, Primitives> {
    return {
      contentsId: this.id,
      size: this.size,
    };
  }
}
