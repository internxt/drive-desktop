import { XFile } from './File';
import { Item } from './Item';
import { XPath } from './XPath';

type XFolderAttributes = {
  id: number;
  name: string;
  parentId: null | number;
  updatedAt: string;
  createdAt: string;
};

export class XFolder extends Item {
  public readonly size: number = 0;

  private constructor(
    public readonly id: number,
    public readonly name: XPath,
    public readonly parentId: null | number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    super();
  }

  static from(attributes: XFolderAttributes): XFolder {
    return new XFolder(
      attributes.id,
      new XPath(attributes.name),
      attributes.parentId,
      new Date(attributes.updatedAt),
      new Date(attributes.createdAt)
    );
  }

  hasParent(id: number): boolean {
    return this.parentId === id;
  }

  isFolder(): this is XFolder {
    return true;
  }

  isFile(): this is XFile {
    return false;
  }

  toProps(): Record<string, string | number> {
    return {
      id: this.id,
      name: this.name.value,
      parentId: this.parentId || 0,
      updatedAt: this.updatedAt.getTime(),
      createdAt: this.createdAt.getTime(),
    };
  }
}
