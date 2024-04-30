import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { StorageFileId } from './StorageFileId';
import { StorageFileSize } from './StorageFileSize';
import { StorageVirtualId } from './StorageVirtualFileId';

export type StorageFileAttributes = {
  id: string;
  virtualId: string;
  size: number;
};

export class StorageFile extends AggregateRoot {
  private constructor(
    private _id: StorageFileId,
    private _virtualId: StorageVirtualId,
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

  public get virtualId() {
    return this._virtualId;
  }

  static from(attributes: StorageFileAttributes): StorageFile {
    return new StorageFile(
      new StorageFileId(attributes.id),
      new StorageVirtualId(attributes.virtualId),
      new StorageFileSize(attributes.size)
    );
  }

  attributes(): StorageFileAttributes {
    return {
      id: this._id.value,
      virtualId: this._virtualId.value,
      size: this._size.value,
    };
  }
}
