import { AggregateRoot } from '../../shared/domain/AggregateRoot';
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
import { ContentsId } from '../../contents/domain/ContentsId';
import { FileMovedDomainEvent } from './events/FileMovedDomainEvent';
import { FileRenamedDomainEvent } from './events/FileRenamedDomainEvent';
import { OfflineFile } from './OfflineFile';
import { ActionNotPermittedError } from './errors/ActionNotPermittedError';

export type FileAttributes = {
  contentsId: string;
  folderId: number;
  createdAt: string;
  modificationTime: string;
  path: string;
  size: number;
  updatedAt: string;
  status: string;
};

export class File extends AggregateRoot {
  private constructor(
    private _contentsId: ContentsId,
    private _folderId: number,
    private _path: FilePath,
    private readonly _size: FileSize,
    public createdAt: Date,
    public updatedAt: Date,
    private _status: FileStatus
  ) {
    super();
  }

  public get contentsId() {
    return this._contentsId.value;
  }

  public get folderId() {
    return this._folderId;
  }

  public get path() {
    return this._path;
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
      new ContentsId(attributes.contentsId),
      attributes.folderId,
      new FilePath(attributes.path),
      new FileSize(attributes.size),
      new Date(attributes.createdAt),
      new Date(attributes.updatedAt),
      FileStatus.fromValue(attributes.status)
    );
  }

  static create(attributes: FileAttributes): File {
    const file = File.from(attributes);

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: file.contentsId,
        size: file.size,
        type: file.type,
      })
    );

    return file;
  }

  trash() {
    this._status = this._status.changeTo(FileStatuses.TRASHED);
    this.updatedAt = new Date();

    this.record(
      new FileDeletedDomainEvent({
        aggregateId: this.contentsId,
        size: this._size.value,
      })
    );
  }

  move(folder: Folder, trackerId: string): void {
    this._folderId = folder.id;
    this._path = this._path.changeFolder(folder.path.value);

    this.record(
      new FileMovedDomainEvent({
        aggregateId: this._contentsId.value,
        trackerId,
      })
    );
  }

  rename(newName: FilePath) {
    this._path = this._path.updateName(`${newName}.${this.type}`);

    this.record(
      new FileRenamedDomainEvent({
        aggregateId: this.contentsId,
      })
    );
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

  hasStatus(status: FileStatuses): boolean {
    return this._status.is(status);
  }

  update(
    attributes: Partial<
      Pick<
        FileAttributes,
        | 'path'
        | 'createdAt'
        | 'updatedAt'
        | 'contentsId'
        | 'folderId'
        | 'status'
      >
    >
  ) {
    if (attributes.path) {
      this._path = new FilePath(attributes.path);
    }

    if (attributes.createdAt) {
      this.createdAt = new Date(attributes.createdAt);
    }

    if (attributes.updatedAt) {
      this.updatedAt = new Date(attributes.updatedAt);
    }

    if (attributes.contentsId) {
      this._contentsId = new ContentsId(attributes.contentsId);
    }

    if (attributes.folderId) {
      this._folderId = attributes.folderId;
    }

    if (attributes.status) {
      this._status = FileStatus.fromValue(attributes.status);
    }

    return this;
  }

  toPrimitives(): Omit<FileAttributes, 'modificationTime'> {
    return {
      contentsId: this.contentsId,
      folderId: this.folderId,
      path: this._path.value,
      size: this._size.value,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      status: this.status.value,
    };
  }

  attributes(): FileAttributes {
    return {
      contentsId: this.contentsId,
      folderId: this.folderId,
      createdAt: this.createdAt.toISOString(),
      path: this._path.value,
      size: this._size.value,
      updatedAt: this.updatedAt.toISOString(),
      status: this.status.value,
      modificationTime: this.updatedAt.toISOString(),
    };
  }
}
