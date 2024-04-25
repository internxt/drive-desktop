import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { StorageFileId } from './StorageFileId';
import { StorageFilePath } from './StorageFilePath';
import { StorageFileSize } from './StorageFileSize';

export type StorageFileAttributes = {
  id: string;
  path: string;
  size: number;
};

export class StorageFile extends AggregateRoot {
  private constructor(
    private _id: StorageFileId,
    private _path: StorageFilePath,
    private _size: StorageFileSize
  ) {
    super();
  }

  public get id() {
    return this._id;
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

  public get nameWithExtension() {
    return this._path.nameWithExtension();
  }

  public get extension() {
    return this._path.extension();
  }

  static from(attributes: StorageFileAttributes): StorageFile {
    return new StorageFile(
      new StorageFileId(attributes.id),
      new StorageFilePath(attributes.path),
      new StorageFileSize(attributes.size)
    );
  }

  attributes(): StorageFileAttributes {
    return {
      id: this._id.value,
      path: this._path.value,
      size: this._size.value,
    };
  }
}
