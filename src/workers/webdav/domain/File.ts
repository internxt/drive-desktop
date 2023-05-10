import { XFolder } from './Folder';
import { Item } from './Item';
import { XPath } from './XPath';

type XFileAtributes = {
  id: number;
  fileId: string;
  folderId: number;
  createdAt: string;
  modificationTime: string;
  name: string;
  size: number;
  type: string;
  updatedAt: string;
};

export class XFile extends Item {
  // private encryptVersion: string = '03-aes';

  private constructor(
    public readonly id: number,
    public readonly fileId: string,
    public readonly folderId: number,
    public readonly name: XPath,
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
      attributes.id,
      attributes.fileId,
      attributes.folderId,
      new XPath(attributes.name),
      attributes.size,
      attributes.type,
      new Date(attributes.createdAt),
      new Date(attributes.updatedAt),
      new Date(attributes.modificationTime)
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
      id: this.id,
      fileId: this.fileId,
      folderId: this.folderId,
      createdAt: this.createdAt.getDate(),
      modificationTime: this.modificationTime.getDate(),
      name: this.name.value,
      size: this.size,
      type: this.type,
      updatedAt: this.updatedAt.getDate(),
    };
  }
}
