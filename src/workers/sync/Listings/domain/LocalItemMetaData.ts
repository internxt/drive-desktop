import { ItemMetaData, ItemMetaDataAttributes } from './ItemMeataData';

type LocalItemMetaDataAttributes = ItemMetaDataAttributes & {
  ino: number;
  dev: number;
};

export class LocalItemMetaData extends ItemMetaData<LocalItemMetaData> {
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
}
