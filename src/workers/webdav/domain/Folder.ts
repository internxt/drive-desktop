import { XFile } from './File';
import { Item } from './Item';
import { XPath } from './XPath';

export type XFolderAttributes = {
  id: number;
  name: string;
  path: string;
  parentId: null | number;
  updatedAt: string;
  createdAt: string;
};

export class XFolder extends Item<XFolder> {
  public readonly size: number = 0;

  private constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly path: XPath,
    public readonly parentId: null | number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    super();
  }

  static from(attributes: XFolderAttributes): XFolder {
    return new XFolder(
      attributes.id,
      attributes.name,
      new XPath(attributes.path),
      attributes.parentId,
      new Date(attributes.updatedAt),
      new Date(attributes.createdAt)
    );
  }

  moveTo(folder: XFolder): XFolder {
    if (!this.parentId) {
      throw new Error('Root folder cannot be moved');
    }

    if (this.parentId === folder.id) {
      throw new Error('Cannot move a folder to its current parent folder');
    }

    const basePath = folder.path.dirname();

    return new XFolder(
      this.id,
      this.name,
      XPath.fromParts([basePath, this.name]),
      folder.id,
      new Date(this.createdAt),
      new Date(this.updatedAt)
    );
  }

  rename(newPath: XPath): XFolder {
    if (!this.path.hasSameDirname(newPath)) {
      throw new Error('A folder rename should mantain the current estructure');
    }

    if (this.path.hasSameName(newPath)) {
      throw new Error('Cannot rename a folder to the same name');
    }

    const newName = newPath.name();

    return new XFolder(
      this.id,
      newName,
      newPath,
      this.parentId,
      new Date(this.updatedAt),
      new Date(this.createdAt)
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
      name: this.name,
      parentId: this.parentId || 0,
      updatedAt: this.updatedAt.getTime(),
      createdAt: this.createdAt.getTime(),
    };
  }
}
