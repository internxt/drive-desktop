import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { FolderPath } from './FolderPath';
import { FolderStatus, FolderStatuses } from './FolderStatus';
import { FolderUuid } from './FolderUuid';
import { Folder } from './Folder';
import { FolderRenamedDomainEvent } from './events/FolderRenamedDomainEvent';
import { FolderId } from './FolderId';

export type OfflineFolderAttributes = {
  uuid: string;
  parentId: number;
  path: string;
  updatedAt: string;
  createdAt: string;
  status: string;
};

export class OfflineFolder extends AggregateRoot {
  private constructor(
    private _uuid: FolderUuid,
    private _path: FolderPath,
    private _parentId: FolderId,
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

  public get basename() {
    return this._path.basename();
  }

  public get dirname() {
    return this._path.dirname();
  }

  public get parentId(): number {
    return this._parentId.value;
  }

  public get status() {
    return this._status;
  }

  public get size() {
    // Currently we cannot acquire the folder size.
    return 0;
  }

  static from(attributes: OfflineFolderAttributes): OfflineFolder {
    return new OfflineFolder(
      new FolderUuid(attributes.uuid),
      new FolderPath(attributes.path),
      new FolderId(attributes.parentId),
      new Date(attributes.updatedAt),
      new Date(attributes.createdAt),
      FolderStatus.fromValue(attributes.status)
    );
  }

  static create(path: FolderPath, parentId: FolderId): OfflineFolder {
    return new OfflineFolder(
      FolderUuid.random(),
      path,
      parentId,
      new Date(),
      new Date(),
      FolderStatus.Exists
    );
  }

  moveTo(destinationFolder: Folder) {
    this._parentId = new FolderId(destinationFolder.id);
  }

  rename(destination: FolderPath) {
    const oldPath = this._path;
    if (this._path.hasSameName(destination)) {
      throw new Error('Cannot rename a folder to the same name');
    }

    this._path = this._path.updateName(destination.name());
    this.updatedAt = new Date();

    const event = new FolderRenamedDomainEvent({
      aggregateId: this.uuid,
      previousPath: oldPath.value,
      nextPath: this._path.value,
    });

    this.record(event);
  }

  isFolder(): this is OfflineFolder {
    return true;
  }

  isFile(): this is File {
    return false;
  }

  hasStatus(status: FolderStatuses): boolean {
    return this._status.value === status;
  }

  attributes(): OfflineFolderAttributes {
    const attributes: OfflineFolderAttributes = {
      uuid: this.uuid,
      parentId: this.parentId,
      path: this._path.value,
      updatedAt: this.updatedAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      status: this.status.value,
    };

    return attributes;
  }
}
