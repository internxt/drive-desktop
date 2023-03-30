import path from 'path';
import Logger from 'electron-log';

export type ItemMetaDataAttributes = {
  modtime: number;
  size: number;
  isFolder: boolean;
  // item name with the path if its on a subfolder form the root sync folder
  name: string;
};

export abstract class ItemMetaData {
  protected constructor(
    public readonly modtime: number,
    public readonly size: number,
    public readonly isFolder: boolean,
    public readonly name: string
  ) {
  }

  abstract same(other: ItemMetaData): boolean;

  isEmpty(): boolean {
    return this.size === 0;
  }

  isEmptyFile(): boolean {
    return this.size === 0 && !this.isFolder;
  }

  haveSameBaseName = (other: string): boolean => {
    Logger.debug('haveSameBaseName:', this.name, other);
    const itemBaseName = path.basename(this.name);
    const otherBaseName = path.basename(other);

    return itemBaseName === otherBaseName;
  }

  isMoreRecentThan(other: ItemMetaData) {
    return this.modtime < other.modtime;
  }
}
