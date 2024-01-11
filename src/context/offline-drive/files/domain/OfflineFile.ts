import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { FilePath } from '../../../virtual-drive/files/domain/FilePath';
import { FileSize } from '../../../virtual-drive/files/domain/FileSize';
import { OfflineFileId } from './OfflineFileId';

export type OfflineFileAttributes = {
  id: string;
  createdAt: number;
  path: string;
  size: number;
};

export class OfflineFile extends AggregateRoot {
  private constructor(
    private _id: OfflineFileId,
    private _createdAt: number,
    private _path: FilePath,
    private _size: FileSize
  ) {
    super();
  }

  public get id(): string {
    return this._id.value;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get path() {
    return this._path.value;
  }
  public get size() {
    return this._size.value;
  }

  static create(
    createdAt: number,
    path: FilePath,
    size: FileSize
  ): OfflineFile {
    const id = OfflineFileId.create();
    const file = new OfflineFile(id, createdAt, path, size);

    return file;
  }

  static from(attributes: OfflineFileAttributes): OfflineFile {
    return new OfflineFile(
      new OfflineFileId(attributes.id),
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
