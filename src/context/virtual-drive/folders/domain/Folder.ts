import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { FolderPath } from './FolderPath';
import { FolderStatus, FolderStatuses } from './FolderStatus';
import { FolderUuid } from './FolderUuid';
import { FolderCreatedDomainEvent } from './events/FolderCreatedDomainEvent';
import { FolderRenamedDomainEvent } from './events/FolderRenamedDomainEvent';
import { createFolderPlaceholderId } from './FolderPlaceholderId';

export type FolderAttributes = {
  id: number;
  uuid: string;
  parentId: null | number;
  path: string;
  updatedAt: string;
  createdAt: string;
  status: string;
};

export class Folder extends AggregateRoot {
  private constructor(
    public id: number,
    private _uuid: FolderUuid,
    private _path: FolderPath,
    private _parentId: null | number,
    public createdAt: Date,
    public updatedAt: Date,
    private _status: FolderStatus
  ) {
    super();
  }

  public get uuid(): string {
    return this._uuid.value;
  }

  public get path(): string {
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

  public get status() {
    return this._status;
  }

  public get size() {
    // Currently we cannot acquire the folder size.
    return 0;
  }

  public get placeholderId() {
    return createFolderPlaceholderId(this.uuid);
  }

  public update(attributes: Partial<FolderAttributes>) {
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

  static from(attributes: FolderAttributes): Folder {
    return new Folder(
      attributes.id,
      new FolderUuid(attributes.uuid),
      new FolderPath(attributes.path),
      attributes.parentId,
      new Date(attributes.updatedAt),
      new Date(attributes.createdAt),
      FolderStatus.fromValue(attributes.status)
    );
  }

  static create(attributes: FolderAttributes): Folder {
    const folder = new Folder(
      attributes.id,
      new FolderUuid(attributes.uuid),
      new FolderPath(attributes.path),
      attributes.parentId,
      new Date(attributes.updatedAt),
      new Date(attributes.createdAt),
      FolderStatus.Exists
    );

    const folderCreatedEvent = new FolderCreatedDomainEvent({
      aggregateId: attributes.uuid,
    });
    folder.record(folderCreatedEvent);

    return folder;
  }

  moveTo(folder: Folder) {
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
    const oldPath = this._path;
    if (this._path.hasSameName(newPath)) {
      throw new Error('Cannot rename a folder to the same name');
    }
    this._path = this._path.updateName(newPath.name());
    this.updatedAt = new Date();

    const event = new FolderRenamedDomainEvent({
      aggregateId: this.uuid,
      previousPath: oldPath.name(),
      nextPath: this._path.name(),
    });

    this.record(event);
  }

  trash() {
    this._status = this._status.changeTo(FolderStatuses.TRASHED);
    this.updatedAt = new Date();

    // TODO: record trashed event
  }

  isIn(folder: Folder): boolean {
    return this._parentId === folder.id;
  }

  isFolder(): this is Folder {
    return true;
  }

  isFile(): this is File {
    return false;
  }

  isRoot(): boolean {
    return !this._parentId;
  }

  hasStatus(status: FolderStatuses): boolean {
    return this._status.value === status;
  }

  attributes() {
    return {
      id: this.id,
      uuid: this.uuid,
      parentId: this._parentId || 0,
      path: this._path.value,
      updatedAt: this.updatedAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      status: this.status.value,
    };
  }
}

export const RootFolderName = '/' as const;
