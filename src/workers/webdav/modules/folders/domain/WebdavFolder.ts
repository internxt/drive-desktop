import { Primitives } from 'shared/types/Primitives';
import { WebdavFile } from '../../files/domain/WebdavFile';
import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { FolderPath } from './FolderPath';
import { FolderStatus, FolderStatuses } from './FolderStatus';

export type WebdavFolderAttributes = {
  id: number;
  path: string;
  parentId: null | number;
  updatedAt: string;
  createdAt: string;
  status: string;
};

export class WebdavFolder extends AggregateRoot {
  public readonly size: number = 0;
  private _lastPath: FolderPath | null = null;
  private constructor(
    public id: number,
    private _path: FolderPath,
    private _parentId: null | number,
    public createdAt: Date,
    public updatedAt: Date,
    private _status: FolderStatus
  ) {
    super();
  }

  public get path() {
    return this._path;
  }

  public get lastPath() {
    return this._lastPath;
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

  public get status() {
    return this._status;
  }

  public update(attributes: Partial<WebdavFolderAttributes>) {
    if (attributes.path) {
      this._path = new FolderPath(attributes.path);
    }

    if (attributes.createdAt) {
      this.createdAt = new Date(attributes.createdAt);
    }

    if (attributes.updatedAt) {
      this.updatedAt = new Date(attributes.updatedAt);
    }

    if (attributes.id) {
      this.id = attributes.id;
    }

    if (attributes.parentId) {
      this._parentId = attributes.parentId;
    }

    if (attributes.status) {
      this._status = FolderStatus.fromValue(attributes.status);
    }

    return this;
  }

  static from(attributes: WebdavFolderAttributes): WebdavFolder {
    return new WebdavFolder(
      attributes.id,
      new FolderPath(attributes.path),
      attributes.parentId,
      new Date(attributes.updatedAt),
      new Date(attributes.createdAt),
      FolderStatus.fromValue(attributes.status)
    );
  }

  static create(attributes: WebdavFolderAttributes) {
    return new WebdavFolder(
      attributes.id,
      new FolderPath(attributes.path),
      attributes.parentId,
      new Date(attributes.updatedAt),
      new Date(attributes.createdAt),
      FolderStatus.Exists
    );
  }

  moveTo(folder: WebdavFolder) {
    if (!this._parentId) {
      throw new Error('Root folder cannot be moved');
    }

    if (this._parentId === folder.id) {
      throw new Error('Cannot move a folder to its current folder');
    }

    this._path = this._path.changeFolder(folder.path.value);
    this._parentId = folder.id;

    //TODO: record moved event
  }

  rename(newPath: FolderPath) {
    if (this._path.hasSameName(newPath)) {
      throw new Error('Cannot rename a folder to the same name');
    }

    this._lastPath = this._path;

    this._path = this._path.updateName(newPath.name());

    //TODO: record rename event
  }

  trash() {
    this._status = this._status.changeTo(FolderStatuses.TRASHED);

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

  hasStatus(status: FolderStatuses): boolean {
    return this._status.value === status;
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
