import { ItemMetaData, ItemMetaDataAttributes } from './ItemMeataData';

export type RemoteItemMetaDataAttributes = ItemMetaDataAttributes & {
  id: number;
};

export class RemoteItemMetaData extends ItemMetaData {
  constructor(
    public readonly modtime: number,
    public readonly size: number,
    public readonly isFolder: boolean,
    public readonly name: string,
    public readonly id: number
  ) {
    super(modtime, size, isFolder, name);
  }

  same(other: RemoteItemMetaData) {
    return this.id === other.id;
  }

  static from(attributes: RemoteItemMetaDataAttributes): RemoteItemMetaData {
    return new RemoteItemMetaData(
      attributes.modtime,
      attributes.size,
      attributes.isFolder,
      attributes.name,
      attributes.id
    );
  }

  toJSON(): RemoteItemMetaDataAttributes {
    return {
      modtime: this.modtime,
      size: this.size,
      isFolder: this.isFolder,
      name: this.name,
      id: this.id,
    };
  }
}
