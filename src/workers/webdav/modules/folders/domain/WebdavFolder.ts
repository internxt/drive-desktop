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
    private _path: FolderPath,
    private _parentId: null | number,
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

  public get parentId() {
    return this._parentId;
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

  moveTo(folder: WebdavFolder) {
    if (!this._parentId) {
      throw new Error('Root folder cannot be moved');
    }

    if (this._parentId === folder.id) {
      throw new Error('Cannot move a folder to its current folder');
    }

    this._path = this._path.changeFolder(folder.path);
    this._parentId = folder.id;

    //TODO: record moved event
  }

  rename(newPath: FolderPath) {
    if (this._path.hasSameName(newPath)) {
      throw new Error('Cannot rename a folder to the same name');
    }

    this._path = this._path.updateName(newPath.name());

    //TODO: record rename event
  }

  trash() {
    // TODO: recored trashed event
  }

  isIn(folder: WebdavFolder): boolean {
    return this._parentId === folder.id;
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
      parentId: this._parentId || 0,
      updatedAt: this.updatedAt.getTime(),
      createdAt: this.createdAt.getTime(),
    };
  }
}
