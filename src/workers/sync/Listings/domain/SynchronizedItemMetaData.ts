import { ItemMetaData, ItemMetaDataAttributes } from './ItemMeataData';
import { LocalItemMetaDataAttributes } from './LocalItemMetaData';
import { RemoteItemMetaDataAttributes } from './RemoteItemMetaData';

export type SynchronizeMetaDataAttributes = ItemMetaDataAttributes &
  RemoteItemMetaDataAttributes &
  LocalItemMetaDataAttributes;

export class SynchronizedItemMetaData extends ItemMetaData<SynchronizedItemMetaData> {
  constructor(
    public readonly modtime: number,
    public readonly size: number,
    public readonly isFolder: boolean,
    private readonly id: string,
    private readonly ino: number,
    private readonly dev: number
  ) {
    super(modtime, size, isFolder);
  }

  same(other: SynchronizedItemMetaData) {
    return (
      this.id === other.id && this.ino === other.ino && this.dev === other.dev
    );
  }

  static from(
    attributes: SynchronizeMetaDataAttributes
  ): SynchronizedItemMetaData {
    return new SynchronizedItemMetaData(
      attributes.modtime,
      attributes.size,
      attributes.isFolder,
      attributes.id,
      attributes.ino,
      attributes.dev
    );
  }
}
