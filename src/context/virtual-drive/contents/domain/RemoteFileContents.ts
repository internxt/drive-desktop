import { ContentsId } from './ContentsId';
import { ContentsSize } from './ContentsSize';

type RemoteFileContentsAttributes = {
  id: string;
  size: number;
};

export class RemoteFileContents {
  private constructor(
    private readonly _id: ContentsId,
    private readonly _size: ContentsSize,
  ) {}

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
    return new RemoteFileContents(new ContentsId(attributes.id), new ContentsSize(attributes.size));
  }
}
