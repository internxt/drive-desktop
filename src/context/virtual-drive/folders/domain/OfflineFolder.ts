import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { FolderPath } from './FolderPath';
import { FolderStatus, FolderStatuses } from './FolderStatus';
import { FolderUuid } from './FolderUuid';
import { Folder } from './Folder';
import { FolderRenamedDomainEvent } from './events/FolderRenamedDomainEvent';

export type OfflineFolderAttributes = {
  uuid: string;
  parentId: number;
  parentUuid: string;
  path: string;
  updatedAt: string;
  createdAt: string;
  status: string;
};

export class OfflineFolder extends AggregateRoot {
  private constructor(
    private _uuid: FolderUuid,
    private _path: FolderPath,
    private _parentId: number,
    private _parentUuid: FolderUuid,
    public createdAt: Date,
    public updatedAt: Date,
    private _status: FolderStatus
  ) {
    super();
  }

  public get uuid(): string {
    return this._uuid.value;
  }

  public get path() {
    return this._path;
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

  public get parentId() {
    return this._parentId;
  }

  public get parentUuid() {
    return this._parentUuid.value;
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
      attributes.parentId,
      attributes.parentUuid
        ? new FolderUuid(attributes.parentUuid)
        : FolderUuid.random(),
      new Date(attributes.updatedAt),
      new Date(attributes.createdAt),
      FolderStatus.fromValue(attributes.status)
    );
  }

  static create(
    path: FolderPath,
    parentId: number,
    parentUuid: string
  ): OfflineFolder {
    return new OfflineFolder(
      FolderUuid.random(),
      path,
      parentId,
      new FolderUuid(parentUuid),
      new Date(),

      new Date(),
      FolderStatus.Exists
    );
  }

  moveTo(destinationFolder: Folder) {
    this._parentId = destinationFolder.id;
    this._parentUuid = new FolderUuid(destinationFolder.uuid);
  }

  rename(destination: FolderPath) {
    const oldPath = this._path;

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
      parentId: this._parentId,
      parentUuid: this._parentUuid.value,
      path: this._path.value,
      updatedAt: this.updatedAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      status: this.status.value,
    };

    return attributes;
  }
}
