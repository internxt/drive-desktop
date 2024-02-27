import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { FolderPath } from './FolderPath';
import { FolderStatus, FolderStatuses } from './FolderStatus';
import { FolderUuid } from './FolderUuid';
import { FolderCreatedDomainEvent } from './events/FolderCreatedDomainEvent';
import { FolderRenamedDomainEvent } from './events/FolderRenamedDomainEvent';
import { createFolderPlaceholderId } from './FolderPlaceholderId';
import { FolderId } from './FolderId';
import { FolderCreatedAt } from './FolderCreatedAt';
import { FolderUpdatedAt } from './FolderUpdatedAt';
import { FolderMovedDomainEvent } from './events/FolderMovedDomainEvent';
import { FolderAlreadyTrashed } from './errors/FolderAlreadyTrashed';

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
    private _id: FolderId,
    private _uuid: FolderUuid,
    private _path: FolderPath,
    private _parentId: null | FolderId,
    public _createdAt: FolderCreatedAt,
    public _updatedAt: FolderUpdatedAt,
    private _status: FolderStatus
  ) {
    super();
  }

  public get id(): number {
    return this._id.value;
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

  public get dirname(): FolderPath {
    return new FolderPath('/' + this._path.dirname());
  }

  public get parentId(): number | undefined {
    return this._parentId?.value;
  }

  public get status(): string {
    return this._status.value;
  }

  public get size() {
    // Currently we cannot acquire the folder size.
    return 0;
  }

  public get placeholderId() {
    return createFolderPlaceholderId(this.uuid);
  }

  public get createdAt(): Date {
    return this._createdAt.value;
  }

  public get updatedAt(): Date {
    return this._updatedAt.value;
  }

  public update(attributes: Partial<FolderAttributes>) {
    if (attributes.path) {
      this._path = new FolderPath(attributes.path);
    }

    if (attributes.createdAt) {
      this._createdAt = FolderCreatedAt.fromString(attributes.createdAt);
    }

    if (attributes.updatedAt) {
      this._updatedAt = FolderUpdatedAt.fromString(attributes.updatedAt);
    }

    if (attributes.id) {
      this._id = new FolderId(attributes.id);
    }

    if (attributes.parentId) {
      this._parentId = new FolderId(attributes.parentId);
    }

    if (attributes.status) {
      this._status = FolderStatus.fromValue(attributes.status);
    }

    return this;
  }

  static from(attributes: FolderAttributes): Folder {
    return new Folder(
      new FolderId(attributes.id),
      new FolderUuid(attributes.uuid),
      new FolderPath(attributes.path),
      attributes.parentId ? new FolderId(attributes.parentId) : null,
      FolderUpdatedAt.fromString(attributes.updatedAt),
      FolderCreatedAt.fromString(attributes.createdAt),
      FolderStatus.fromValue(attributes.status)
    );
  }

  static create(
    id: FolderId,
    uuid: FolderUuid,
    path: FolderPath,
    parentId: FolderId,
    createdAt: FolderCreatedAt,
    updatedAt: FolderUpdatedAt
  ): Folder {
    const folder = new Folder(
      id,
      uuid,
      path,
      parentId,
      createdAt,
      updatedAt,
      FolderStatus.Exists
    );

    const folderCreatedEvent = new FolderCreatedDomainEvent({
      aggregateId: folder.uuid,
    });
    folder.record(folderCreatedEvent);

    return folder;
  }

  moveTo(folder: Folder) {
    if (!this._parentId) {
      throw new Error('Root folder cannot be moved');
    }

    if (this.isIn(folder)) {
      throw new Error('Cannot move a folder to its current folder');
    }

    const before = this.path;

    this._path = this._path.changeFolder(folder.path);
    this._parentId = new FolderId(folder.id);

    this.record(
      new FolderMovedDomainEvent({
        aggregateId: this.uuid,
        from: before,
        to: this.path,
      })
    );
  }

  rename(newPath: FolderPath) {
    const oldPath = this._path;
    if (this._path.hasSameName(newPath)) {
      throw new Error('Cannot rename a folder to the same name');
    }
    this._path = this._path.updateName(newPath.name());
    this._updatedAt = FolderUpdatedAt.now();

    const event = new FolderRenamedDomainEvent({
      aggregateId: this.uuid,
      previousPath: oldPath.name(),
      nextPath: this._path.name(),
    });

    this.record(event);
  }

  trash() {
    if (!this._status.is(FolderStatuses.EXISTS)) {
      throw new FolderAlreadyTrashed(this.name);
    }

    this._status = this._status.changeTo(FolderStatuses.TRASHED);
    this._updatedAt = FolderUpdatedAt.now();

    // TODO: record trashed event
  }

  isIn(folder: Folder): boolean {
    return this.parentId === folder.id;
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
      parentId: this.parentId || 0,
      path: this.path,
      updatedAt: this.updatedAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      status: this.status,
    };
  }
}

export const RootFolderName = '/' as const;
