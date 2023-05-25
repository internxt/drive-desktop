import { XFolder } from './Folder';
import { Item } from './Item';
import { XPath } from './XPath';

export type XFileAtributes = {
  fileId: string;
  folderId: number;
  createdAt: string;
  modificationTime: string;
  name: string;
  path: string;
  size: number;
  type: string;
  updatedAt: string;
};

export class XFile extends Item<XFile> {
  // private encryptVersion: string = '03-aes';

  constructor(
    public readonly fileId: string,
    public readonly folderId: number,
    public readonly name: string,
    public readonly path: XPath,
    public readonly size: number,
    public readonly type: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly modificationTime: Date
  ) {
    super();
  }

  static from(attributes: XFileAtributes): XFile {
    return new XFile(
      attributes.fileId,
      attributes.folderId,
      attributes.name,
      new XPath(attributes.path),
      attributes.size,
      attributes.type,
      new Date(attributes.createdAt),
      new Date(attributes.updatedAt),
      new Date(attributes.modificationTime)
    );
  }

  moveTo(folder: XFolder): XFile {
    if (this.folderId === folder.id) {
      throw new Error('Cannot move a file to its current folder');
    }

    const basePath = folder.path.dirname();

    const file = new XFile(
      this.fileId,
      folder.id,
      this.name,
      XPath.fromParts([basePath, this.name]),
      this.size,
      this.type,
      this.createdAt,
      this.updatedAt,
      this.modificationTime
    );

    return file;
  }

  clone(fileId: string, newPath: XPath) {
    if (!this.path.hasSameDirname(newPath)) {
      throw new Error('A file rename should mantain the current estructure');
    }

    if (this.path.hasSameName(newPath)) {
      throw new Error('Cannot rename a file to the same name');
    }

    const newName = newPath.name();

    return new XFile(
      fileId,
      this.folderId,
      newName,
      newPath,
      this.size,
      this.type,
      this.createdAt,
      this.updatedAt,
      this.modificationTime
    );
  }

  rename(newPath: XPath) {
    if (!this.path.hasSameDirname(newPath)) {
      throw new Error('A file rename should mantain the current estructure');
    }

    if (newPath.extension() !== this.type) {
      throw new Error('A file reanme cannot change the extension');
    }

    if (this.path.hasSameName(newPath)) {
      throw new Error('Cannot rename a file to the same name');
    }

    const newName = newPath.name();

    return new XFile(
      this.fileId,
      this.folderId,
      newName,
      newPath,
      this.size,
      this.type,
      this.createdAt,
      this.updatedAt,
      this.modificationTime
    );
  }

  hasParent(id: number): boolean {
    return this.folderId === id;
  }

  isFolder(): this is XFolder {
    return false;
  }

  isFile(): this is XFile {
    return true;
  }

  toProps() {
    return {
      fileId: this.fileId,
      folderId: this.folderId,
      createdAt: this.createdAt.getDate(),
      modificationTime: this.modificationTime.getDate(),
      name: this.name,
      size: this.size,
      type: this.type,
      updatedAt: this.updatedAt.getDate(),
    };
  }
}
