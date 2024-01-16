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

  public get id(): string {
    return this._id.value;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get path() {
    return this._path.value;
  }
  public get size() {
    return this._size.value;
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
