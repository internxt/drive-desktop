export type ItemMetaDataAttributes = {
  modtime: number;
  size: number;
  isFolder: boolean;
};

export abstract class ItemMetaData {
  protected constructor(
    public readonly modtime: number,
    public readonly size: number,
    public readonly isFolder: boolean
  ) {}

  abstract same(other: ItemMetaData): boolean;

  isEmpty(): boolean {
    return this.size === 0;
  }

  isEmptyFile(): boolean {
    return this.size === 0 && !this.isFolder;
  }
}
