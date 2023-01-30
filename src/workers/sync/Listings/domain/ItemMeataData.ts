export abstract class ItemMetaData<T> {
  constructor(
    public readonly modtime: number,
    public readonly size: number,
    public readonly isFolder: boolean
  ) {}

  abstract same(other: T): boolean;

  isEmpty(): boolean {
    return this.size === 0;
  }
}

export type ItemMetaDataAttributes = {
  modtime: number;
  size: number;
  isFolder: boolean;
};
