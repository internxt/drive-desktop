import { ItemMetaData, ItemMetaDataAttributes } from './ItemMeataData';

export type RemoteItemMetaDataAttributes = ItemMetaDataAttributes & {
  id: string;
};

export class RemoteItemMetaData extends ItemMetaData<RemoteItemMetaData> {
  constructor(
    public readonly modtime: number,
    public readonly size: number,
    public readonly isFolder: boolean,
    private readonly id: string
  ) {
    super(modtime, size, isFolder);
  }

  same(other: RemoteItemMetaData) {
    return this.id === other.id;
  }

  static from(attributes: RemoteItemMetaDataAttributes): RemoteItemMetaData {
    return new RemoteItemMetaData(
      attributes.modtime,
      attributes.size,
      attributes.isFolder,
      attributes.id
    );
  }

  toJSON(): RemoteItemMetaDataAttributes {
    return {
      modtime: this.modtime,
      size: this.size,
      isFolder: this.isFolder,
      id: this.id,
    };
  }
}
