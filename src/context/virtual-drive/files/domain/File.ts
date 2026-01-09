import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { Folder } from '../../folders/domain/Folder';
import { FilePath } from './FilePath';
import { FileSize } from './FileSize';
import { FileCreatedDomainEvent } from './events/FileCreatedDomainEvent';
import { FileCannotBeMovedToTheOriginalFolderError } from './errors/FileCannotBeMovedToTheOriginalFolderError';
import { FileActionOnlyCanAffectOneLevelError } from './errors/FileActionOnlyCanAffectOneLevelError';
import { FileNameShouldDifferFromOriginalError } from './errors/FileNameShouldDifferFromOriginalError';
import { FileActionCannotModifyExtension } from './errors/FileActionCannotModifyExtension';
import { FileDeletedDomainEvent } from './events/FileDeletedDomainEvent';
import { FileStatus, FileStatuses } from './FileStatus';
import { FileMovedDomainEvent } from './events/FileMovedDomainEvent';
import { FileRenamedDomainEvent } from './events/FileRenamedDomainEvent';
import { FileOverriddenDomainEvent } from './events/FileOverriddenDomainEvent';
import { FileUuid } from './FileUuid';
import { FileContentsId } from './FileContentsId';
import { FileFolderId } from './FileFolderId';

export type FileAttributes = {
  id: number;
  uuid: string;
  contentsId: string;
  folderId: number;
  createdAt: string;
  modificationTime: string;
  path: string;
  size: number;
  updatedAt: string;
  status: FileStatuses;
};

export class File extends AggregateRoot {
  private constructor(
    private _id: number,
    private _uuid: FileUuid,
    private _contentsId: FileContentsId,
    private _folderId: FileFolderId,
    private _path: FilePath,
    private _size: FileSize,
    public createdAt: Date,
    public updatedAt: Date,
    private _status: FileStatus,
  ) {
    super();
  }

  public get id(): number {
    return this._id;
  }

  public get uuid(): string {
    return this._uuid.value;
  }

  public get contentsId() {
    return this._contentsId.value;
  }

  public get folderId() {
    return this._folderId.value;
  }

  public get path(): string {
    return this._path.value;
  }

  public get type() {
    return this._path.extension();
  }

  public get name() {
    return this._path.name();
  }

  public get nameWithExtension() {
    return this._path.nameWithExtension();
  }

  public get dirname() {
    return this._path.dirname();
  }

  public get size(): number {
    return this._size.value;
  }

  public get status() {
    return this._status;
  }

  static from(attributes: FileAttributes): File {
    return new File(
      attributes.id,
      new FileUuid(attributes.uuid),
      new FileContentsId(attributes.contentsId),
      new FileFolderId(attributes.folderId),
      new FilePath(attributes.path),
      new FileSize(attributes.size),
      new Date(attributes.createdAt),
      new Date(attributes.updatedAt),
      FileStatus.fromValue(attributes.status),
    );
  }

  static create(attributes: Omit<FileAttributes, 'status'>): File {
    const file = new File(
      attributes.id,
      new FileUuid(attributes.uuid),
      new FileContentsId(attributes.contentsId),
      new FileFolderId(attributes.folderId),
      new FilePath(attributes.path),
      new FileSize(attributes.size),
      new Date(attributes.createdAt),
      new Date(attributes.updatedAt),
      FileStatus.Exists,
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: file.uuid,
        size: file.size,
        type: file.type,
        path: file.path,
      }),
    );

    return file;
  }

  trash() {
    this._status = this._status.changeTo(FileStatuses.TRASHED);
    this.updatedAt = new Date();

    this.record(
      new FileDeletedDomainEvent({
        aggregateId: this.uuid,
        size: this._size.value,
      }),
    );
  }

  moveTo(folder: Folder): void {
    if (this.folderId === folder.id) {
      throw new FileCannotBeMovedToTheOriginalFolderError(this.path);
    }

    this._folderId = new FileFolderId(folder.id);
    this._path = this._path.changeFolder(folder.path);

    this.record(
      new FileMovedDomainEvent({
        aggregateId: this.uuid,
      }),
    );
  }

  rename(newPath: FilePath) {
    const currentName = this.name;

    if (!this._path.hasSameDirname(newPath)) {
      throw new FileActionOnlyCanAffectOneLevelError('rename');
    }

    if (!newPath.hasSameExtension(this._path)) {
      throw new FileActionCannotModifyExtension('rename');
    }

    if (this._path.hasSameName(newPath)) {
      throw new FileNameShouldDifferFromOriginalError('rename');
    }

    this._path = this._path.updateName(newPath.nameWithExtension());

    this.record(
      new FileRenamedDomainEvent({
        aggregateId: this.uuid,
        oldName: currentName,
      }),
    );
  }

  changeContents(contentsId: FileContentsId, contentsSize: FileSize) {
    const previousContentsId = this.contentsId;
    const previousSize = this.size;

    this._contentsId = contentsId;
    this._size = contentsSize;

    this.record(
      new FileOverriddenDomainEvent({
        aggregateId: this.uuid,
        previousContentsId,
        previousSize,
        currentContentsId: contentsId.value,
        currentSize: contentsSize.value,
      }),
    );
  }

  update(attributes: Partial<FileAttributes>) {
    if (attributes.path) {
      this._path = new FilePath(attributes.path);
    }

    if (attributes.folderId) {
      this._folderId = new FileFolderId(attributes.folderId);
    }

    if (attributes.size !== undefined) {
      this._size = new FileSize(attributes.size);
    }

    if (attributes.contentsId) {
      this._contentsId = new FileContentsId(attributes.contentsId);
    }

    if (attributes.status) {
      this._status = FileStatus.fromValue(attributes.status);
    }

    if (attributes.updatedAt) {
      this.updatedAt = new Date(attributes.updatedAt);
    }

    if (attributes.createdAt) {
      this.createdAt = new Date(attributes.createdAt);
    }
  }

  hasParent(id: number): boolean {
    return this.folderId === id;
  }

  isFolder(): this is Folder {
    return false;
  }

  isFile(): this is File {
    return true;
  }

  isThumbnable(): boolean {
    return this._path.isThumbnable();
  }

  mimeType() {
    return this._path.mimeType();
  }

  hasStatus(status: FileStatuses): boolean {
    return this._status.is(status);
  }

  attributes(): FileAttributes {
    return {
      id: this.id,
      uuid: this.uuid,
      contentsId: this.contentsId,
      folderId: this.folderId,
      createdAt: this.createdAt.toISOString(),
      path: this.path,
      size: this.size,
      updatedAt: this.updatedAt.toISOString(),
      status: this.status.value,
      modificationTime: this.updatedAt.toISOString(),
    };
  }
}
