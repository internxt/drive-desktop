import { FolderPath } from './FolderPath';
import { FolderStatus, FolderStatuses } from './FolderStatus';
import { FolderUuid } from './FolderUuid';
import { createFolderPlaceholderId } from './FolderPlaceholderId';
import { FolderId } from './FolderId';
import { FolderCreatedAt } from './FolderCreatedAt';
import { FolderUpdatedAt } from './FolderUpdatedAt';
import * as crypt from '@/context/shared/infrastructure/crypt';

export type FolderAttributes = {
  id: number;
  uuid: string;
  parentId: null | number;
  parentUuid: null | string;
  path: string;
  updatedAt: string;
  createdAt: string;
  status: string;
};

export class Folder {
  private constructor(
    private _id: FolderId,
    private _uuid: FolderUuid,
    private _path: FolderPath,
    private _parentId: null | FolderId,
    private _parentUuid: null | FolderUuid,
    public _createdAt: FolderCreatedAt,
    public _updatedAt: FolderUpdatedAt,
    private _status: FolderStatus,
  ) {}

  public get id(): number {
    return this._id?.value;
  }

  public get uuid(): string {
    return this._uuid.value.toString();
  }

  public get path(): string {
    return this._path.value;
  }

  public get name() {
    return this._path.name();
  }

  public get dirname(): FolderPath {
    return new FolderPath(this._path.dirname());
  }

  public get parentId(): number | undefined {
    return this._parentId?.value;
  }

  public get parentUuid(): string | undefined {
    return this._parentUuid?.value;
  }

  public get status(): FolderStatuses {
    return this._status.value;
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

  static from(attributes: FolderAttributes): Folder {
    return new Folder(
      new FolderId(attributes.id),
      new FolderUuid(attributes.uuid),
      new FolderPath(attributes.path),
      attributes.parentId ? new FolderId(attributes.parentId) : null,
      attributes.parentUuid ? new FolderUuid(attributes.parentUuid) : null,
      FolderUpdatedAt.fromString(attributes.updatedAt),
      FolderCreatedAt.fromString(attributes.createdAt),
      FolderStatus.fromValue(attributes.status),
    );
  }

  static decryptName({ plainName, name, parentId }: { plainName?: string | null; name: string; parentId?: number | null }) {
    const decryptedName = plainName || crypt.decryptName({ encryptedName: name, parentId });
    return decryptedName;
  }

  moveTo(folder: Folder) {
    if (!this._parentId) {
      throw new Error('Root folder cannot be moved');
    }
    if (this.isIn(folder)) {
      throw new Error('Cannot move a folder to its current folder');
    }

    this._path = this._path.changeFolder(folder.path);
    this._parentId = new FolderId(folder.id);
    this._parentUuid = new FolderUuid(folder.uuid);
  }

  rename(newPath: FolderPath) {
    this._path = this._path.updateName(newPath.name());
    this._updatedAt = FolderUpdatedAt.now();
  }

  trash() {
    if (!this._status.is(FolderStatuses.EXISTS)) {
      throw new Error(`Folder ${this.name} is already in the trash`);
    }

    this._status = this._status.changeTo(FolderStatuses.TRASHED);
    this._updatedAt = FolderUpdatedAt.now();
  }

  isIn(folder: Folder): boolean {
    return this.parentId === folder.id;
  }

  hasStatus(status: FolderStatuses): boolean {
    return this._status.value === status;
  }

  attributes() {
    return {
      id: this.id,
      uuid: this.uuid,
      parentId: this.parentId ?? 0,
      parentUuid: this.parentUuid ?? '',
      path: this.path,
      updatedAt: this.updatedAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      status: this.status,
    };
  }
}
