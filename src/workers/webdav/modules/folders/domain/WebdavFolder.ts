import { WebdavFile } from '../../files/domain/WebdavFile';
import { WebdavItem } from '../../shared/domain/WebdavItem';
import { FolderPath } from './FolderPath';

export type WebdavFolderAttributes = {
  id: number;
  name: string;
  path: string;
  parentId: null | number;
  updatedAt: string;
  createdAt: string;
};

export class WebdavFolder extends WebdavItem {
  public readonly size: number = 0;

  private constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly path: FolderPath,
    public readonly parentId: null | number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    super();
  }

  static from(attributes: WebdavFolderAttributes): WebdavFolder {
    return new WebdavFolder(
      attributes.id,
      attributes.name,
      new FolderPath(attributes.path),
      attributes.parentId,
      new Date(attributes.updatedAt),
      new Date(attributes.createdAt)
    );
  }

  static create(attributes: {
    id: number;
    name: string;
    parentId: number | null;
    updatedAt: string;
    createdAt: string;
    path: string;
  }) {
    return new WebdavFolder(
      attributes.id,
      attributes.name,
      new FolderPath(attributes.path),
      attributes.parentId,
      new Date(attributes.updatedAt),
      new Date(attributes.createdAt)
    );
  }

  moveTo(folder: WebdavFolder): WebdavFolder {
    if (!this.parentId) {
      throw new Error('Root folder cannot be moved');
    }

    if (this.parentId === folder.id) {
      throw new Error('Cannot move a folder to its current parent folder');
    }

    const basePath = folder.path.dirname();

    return new WebdavFolder(
      this.id,
      this.name,
      FolderPath.fromParts([basePath, this.name]),
      folder.id,
      new Date(this.createdAt),
      new Date(this.updatedAt)
    );
  }

  rename(newPath: FolderPath): WebdavFolder {
    if (this.path.hasSameName(newPath)) {
      throw new Error('Cannot rename a folder to the same name');
    }

    const newName = newPath.name();

    return new WebdavFolder(
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

  isFolder(): this is WebdavFolder {
    return true;
  }

  isFile(): this is WebdavFile {
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
