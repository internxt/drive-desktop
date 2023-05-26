import { XFile } from './File';
import { XFolder } from './Folder';
import { XPath } from './XPath';

export abstract class Item<T> {
  abstract readonly name: string;

  abstract readonly path: XPath;

  abstract readonly createdAt: Date;

  abstract readonly updatedAt: Date;

  abstract readonly size: number;

  abstract rename(path: XPath): T;
  abstract moveTo(folder: XFolder): T;

  abstract isFolder(): this is XFolder;
  abstract isFile(): this is XFile;
  abstract hasParent(id: number): boolean;
  abstract toProps(): Record<string, string | number>;
}
