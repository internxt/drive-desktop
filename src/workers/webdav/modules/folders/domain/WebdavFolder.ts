import { Primitives } from 'shared/types/Primitives';
import { WebdavFile } from '../../files/domain/WebdavFile';
import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { FolderPath } from './FolderPath';

export type WebdavFolderAttributes = {
  id: number;
  path: string;
  parentId: null | number;
  updatedAt: string;
  createdAt: string;
};

export class WebdavFolder extends AggregateRoot {
  public readonly size: number = 0;

  private constructor(
    public readonly id: number,
    private readonly _path: FolderPath,
    public readonly parentId: null | number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    super();
  }

  public get path() {
    return this._path.value;
  }

  public get name() {
    return this._path.name();
  }

  public get dirname() {
    return this._path.dirname();
  }

  static from(attributes: WebdavFolderAttributes): WebdavFolder {
    return new WebdavFolder(
      attributes.id,
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

    return new WebdavFolder(
      this.id,
      FolderPath.fromParts([folder.dirname, this.name]),
      folder.id,
      new Date(this.createdAt),
      new Date(this.updatedAt)
    );
  }

  rename(newPath: FolderPath): WebdavFolder {
    if (this._path.hasSameName(newPath)) {
      throw new Error('Cannot rename a folder to the same name');
    }

    return new WebdavFolder(
      this.id,
      newPath,
      this.parentId,
      new Date(this.updatedAt),
      new Date(this.createdAt)
    );
  }

  isIn(folder: WebdavFolder): boolean {
    return this.parentId === folder.id;
  }

  isFolder(): this is WebdavFolder {
    return true;
  }

  isFile(): this is WebdavFile {
    return false;
  }

  toPrimitives(): Record<string, Primitives> {
    return {
      id: this.id,
      parentId: this.parentId || 0,
      updatedAt: this.updatedAt.getTime(),
      createdAt: this.createdAt.getTime(),
    };
  }
}
