import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { OfflineFileId } from './OfflineFileId';
import { OfflineFilePath } from './OfflineFilePath';
import { OfflineFileSize } from './OfflineFileSize';

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
    private _path: OfflineFilePath,
    private _size: OfflineFileSize
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
    path: OfflineFilePath,
    size: OfflineFileSize
  ): OfflineFile {
    const id = OfflineFileId.create();
    const file = new OfflineFile(id, createdAt, path, size);

    return file;
  }

  static from(attributes: OfflineFileAttributes): OfflineFile {
    return new OfflineFile(
      new OfflineFileId(attributes.id),
      attributes.createdAt,
      new OfflineFilePath(attributes.path),
      new OfflineFileSize(attributes.size)
    );
  }

  increaseSizeBy(bytes: number): void {
    const newSize = this.size + bytes;

    this._size = new OfflineFileSize(newSize);
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
