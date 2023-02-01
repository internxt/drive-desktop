import { ItemMetaData, ItemMetaDataAttributes } from './ItemMeataData';

export type LocalItemMetaDataAttributes = ItemMetaDataAttributes & {
  ino: number;
  dev: number;
};

export class LocalItemMetaData extends ItemMetaData {
  constructor(
    public readonly modtime: number,
    public readonly size: number,
    public readonly isFolder: boolean,
    private readonly ino: number,
    private readonly dev: number
  ) {
    super(modtime, size, isFolder);
  }

  same(other: LocalItemMetaData) {
    return this.ino === other.ino && this.dev === other.dev;
  }

  static from(attributes: LocalItemMetaDataAttributes): LocalItemMetaData {
    return new LocalItemMetaData(
      attributes.modtime,
      attributes.size,
      attributes.isFolder,
      attributes.ino,
      attributes.dev
    );
  }

  toJSON(): LocalItemMetaDataAttributes {
    return {
      modtime: this.modtime,
      size: this.size,
      isFolder: this.isFolder,
      ino: this.ino,
      dev: this.dev,
    };
  }
}
