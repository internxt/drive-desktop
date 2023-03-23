import { ItemMetaData, ItemMetaDataAttributes } from './ItemMeataData';
import { LocalItemMetaDataAttributes } from './LocalItemMetaData';
import { RemoteItemMetaDataAttributes } from './RemoteItemMetaData';

export interface SynchronizeMetaDataAttributes
  extends ItemMetaDataAttributes,
    RemoteItemMetaDataAttributes,
    LocalItemMetaDataAttributes {}

export class SynchronizedItemMetaData extends ItemMetaData {
  private constructor(
    public readonly modtime: number,
    public readonly size: number,
    public readonly isFolder: boolean,
    public readonly name: string,
    private readonly id: number,
    private readonly ino: number,
    private readonly dev: number
  ) {
    super(modtime, size, isFolder, name);
  }

  same(other: SynchronizedItemMetaData) {
    return (
      this.id === other.id && this.ino === other.ino && this.dev === other.dev
    );
  }

  isLocal = (local: LocalItemMetaDataAttributes) => {
    return this.ino === local.ino && this.dev === local.dev;
  };

  isRemote = (remote: RemoteItemMetaDataAttributes) => {
    return this.id === remote.id;
  }

  static from(
    attributes: SynchronizeMetaDataAttributes
  ): SynchronizedItemMetaData {
    return new SynchronizedItemMetaData(
      attributes.modtime,
      attributes.size,
      attributes.isFolder,
      attributes.name,
      attributes.id,
      attributes.ino,
      attributes.dev
    );
  }

  toJson(): SynchronizeMetaDataAttributes {
    return {
      modtime: this.modtime,
      size: this.size,
      isFolder: this.isFolder,
      name: this.name,
      id: this.id,
      ino: this.ino,
      dev: this.dev,
    };
  }
}
