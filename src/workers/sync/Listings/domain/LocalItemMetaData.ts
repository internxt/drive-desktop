import { ItemMetaData, ItemMetaDataAttributes } from './ItemMeataData';

export type LocalItemMetaDataAttributes = ItemMetaDataAttributes & {
  ino: number;
  dev: number;
  absolutePath: string;
};

export class LocalItemMetaData extends ItemMetaData {
  constructor(
    public readonly modtime: number,
    public readonly size: number,
    public readonly isFolder: boolean,
    public readonly name: string,
    public readonly ino: number,
    public readonly dev: number,
    public readonly absolutePath: string
  ) {
    super(modtime, size, isFolder, name);
  }

  same(other: LocalItemMetaData) {
    return this.ino === other.ino && this.dev === other.dev;
  }

  static from(attributes: LocalItemMetaDataAttributes): LocalItemMetaData {
    return new LocalItemMetaData(
      attributes.modtime,
      attributes.size,
      attributes.isFolder,
      attributes.name,
      attributes.ino,
      attributes.dev,
      attributes.absolutePath
    );
  }

  toJSON(): LocalItemMetaDataAttributes {
    return {
      modtime: this.modtime,
      size: this.size,
      isFolder: this.isFolder,
      name: this.name,
      ino: this.ino,
      dev: this.dev,
      absolutePath: this.absolutePath,
    };
  }
}
