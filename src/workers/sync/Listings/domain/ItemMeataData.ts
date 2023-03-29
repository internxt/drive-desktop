import path from "path";

export type ItemMetaDataAttributes = {
  modtime: number;
  size: number;
  isFolder: boolean;
  name: string;
};

export abstract class ItemMetaData {
  protected constructor(
    public readonly modtime: number,
    public readonly size: number,
    public readonly isFolder: boolean,
    public readonly name: string
  ) {}

  abstract same(other: ItemMetaData): boolean;

  isEmpty(): boolean {
    return this.size === 0;
  }

  isEmptyFile(): boolean {
    return this.size === 0 && !this.isFolder;
  }

  haveSameBaseName(other: string): boolean {
    const itemBaseName = path.basename(this.name);
    const otherBaseName = path.basename(other);

    return itemBaseName === otherBaseName;
  }

  isMoreRecentThan(other: ItemMetaData) {
    return this.modtime < other.modtime;
  }
}
