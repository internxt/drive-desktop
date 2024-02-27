import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { OfflineFileId } from './OfflineFileId';
import { OfflineFilePath } from './OfflineFilePath';
import { OfflineFileSize } from './OfflineFileSize';

export type OfflineFileAttributes = {
  id: string;
  createdAt: Date;
  path: string;
  size: number;
};

export class OfflineFile extends AggregateRoot {
  private constructor(
    private _id: OfflineFileId,
    private _createdAt: Date,
    private _path: OfflineFilePath,
    private _size: OfflineFileSize
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
    return this._path;
  }
  public get size() {
    return this._size;
  }

  public get name() {
    return this._path.name();
  }

  public get extension() {
    return this._path.extension();
  }

  static create(path: OfflineFilePath, size: OfflineFileSize): OfflineFile {
    const id = OfflineFileId.create();
    const createdAt = new Date();

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
    this._size = this._size.increment(bytes);
  }

  attributes(): OfflineFileAttributes {
    return {
      id: this._id.value,
      createdAt: this._createdAt,
      path: this._path.value,
      size: this._size.value,
    };
  }
}
