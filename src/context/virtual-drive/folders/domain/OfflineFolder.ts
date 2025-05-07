import { FolderPath } from './FolderPath';
import { FolderStatus } from './FolderStatus';
import { FolderUuid } from './FolderUuid';

type OfflineFolderAttributes = {
  uuid: string;
  parentId: number;
  parentUuid: string;
  path: string;
  updatedAt: string;
  createdAt: string;
  status: string;
};

export class OfflineFolder {
  private constructor(
    private _uuid: FolderUuid,
    private _path: FolderPath,
    private _parentId: number,
    private _parentUuid: FolderUuid,
    public createdAt: Date,
    public updatedAt: Date,
    private _status: FolderStatus,
  ) {}

  public get uuid(): string {
    return this._uuid.value;
  }

  public get path() {
    return this._path;
  }

  public get basename() {
    return this._path.basename();
  }

  public get parentUuid() {
    return this._parentUuid.value;
  }

  public get status() {
    return this._status;
  }

  static create(path: FolderPath, parentId: number, parentUuid: string): OfflineFolder {
    return new OfflineFolder(FolderUuid.random(), path, parentId, new FolderUuid(parentUuid), new Date(), new Date(), FolderStatus.Exists);
  }

  static from(attributes: OfflineFolderAttributes): OfflineFolder {
    return new OfflineFolder(
      new FolderUuid(attributes.uuid),
      new FolderPath(attributes.path),
      attributes.parentId,
      attributes.parentUuid ? new FolderUuid(attributes.parentUuid) : FolderUuid.random(),
      new Date(attributes.updatedAt),
      new Date(attributes.createdAt),
      FolderStatus.fromValue(attributes.status),
    );
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
