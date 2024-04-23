import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { LocalFileId } from './LocalFileId';
import { LocalFilePath } from './LocalFilePath';
import { LocalFileSize } from './LocalFileSize';

export type DocumentAttributes = {
  id: string;
  createdAt: Date;
  modifiedAt: Date;
  path: string;
  size: number;
};

export class LocalFile extends AggregateRoot {
  private constructor(
    private _id: LocalFileId,
    private _createdAt: Date,
    private _path: LocalFilePath,
    private _size: LocalFileSize,
    private readonly _modifiedTime: Date
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

  public get modifiedTime() {
    return this._modifiedTime;
  }

  static from(attributes: DocumentAttributes): LocalFile {
    return new LocalFile(
      new LocalFileId(attributes.id),
      attributes.createdAt,
      new LocalFilePath(attributes.path),
      new LocalFileSize(attributes.size),
      attributes.modifiedAt
    );
  }

  attributes(): DocumentAttributes {
    return {
      id: this._id.value,
      createdAt: this._createdAt,
      modifiedAt: this._modifiedTime,
      path: this._path.value,
      size: this._size.value,
    };
  }
}
