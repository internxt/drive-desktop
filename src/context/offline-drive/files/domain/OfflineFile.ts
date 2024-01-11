import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { FilePath } from '../../../virtual-drive/files/domain/FilePath';
import { FileSize } from '../../../virtual-drive/files/domain/FileSize';

export type OfflineFileAttributes = {
  id: string;
  createdAt: number;
  path: string;
  size: number;
};

export class OfflineFile extends AggregateRoot {
  private constructor(
    private _id: string,
    private _createdAt: number,
    private _path: FilePath,
    private _size: FileSize
  ) {
    super();
  }

  public get id() {
    return this._id;
  }
  public get createdAt() {
    return this._createdAt;
  }
  public get path() {
    return this._path.value;
  }
  public get size() {
    return this._size.value;
  }

  static create(
    id: string,
    createdAt: number,
    path: FilePath,
    size: FileSize
  ): OfflineFile {
    const file = new OfflineFile(id, createdAt, path, size);

    return file;
  }

  static from(attributes: OfflineFileAttributes): OfflineFile {
    return new OfflineFile(
      attributes.id,
      attributes.createdAt,
      new FilePath(attributes.path),
      new FileSize(attributes.size)
    );
  }

  increaseSizeBy(bytes: number): void {
    const newSize = this.size + bytes;

    this._size = new FileSize(newSize);
  }

  attributes(): OfflineFileAttributes {
    return {
      id: this.id,
      createdAt: this.createdAt,
      path: this.path,
      size: this.size,
    };
  }
}
