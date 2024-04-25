import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { StorageFileId } from './StorageFileId';
import { StorageFileSize } from './StorageFileSize';

export type StorageFileAttributes = {
  id: string;
  size: number;
};

export class StorageFile extends AggregateRoot {
  private constructor(
    private _id: StorageFileId,
    private _size: StorageFileSize
  ) {
    super();
  }

  public get id() {
    return this._id;
  }

  public get size() {
    return this._size;
  }

  static from(attributes: StorageFileAttributes): StorageFile {
    return new StorageFile(
      new StorageFileId(attributes.id),
      new StorageFileSize(attributes.size)
    );
  }

  attributes(): StorageFileAttributes {
    return {
      id: this._id.value,
      size: this._size.value,
    };
  }
}
