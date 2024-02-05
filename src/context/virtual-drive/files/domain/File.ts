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
import { ContentsId } from '../../contents/domain/ContentsId';
import { FileMovedDomainEvent } from './events/FileMovedDomainEvent';
import { FileRenamedDomainEvent } from './events/FileRenamedDomainEvent';
import { FilePlaceholderId, createFilePlaceholderId } from './PlaceholderId';

export type FileAttributes = {
  id: number;
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

  public get id(): number {
    return this._id;
  }

  public get contentsId() {
    return this._contentsId.value;
  }

  public get folderId() {
    return this._folderId;
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

  public get placeholderId(): FilePlaceholderId {
    return createFilePlaceholderId(this.contentsId);
  }

  static from(attributes: FileAttributes): File {
    return new File(
      attributes.id,
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
    const file = new File(
      attributes.id,
      new ContentsId(attributes.contentsId),
      attributes.folderId,
      new FilePath(attributes.path),
      new FileSize(attributes.size),
      new Date(attributes.createdAt),
      new Date(attributes.updatedAt),
      FileStatus.fromValue(attributes.status)
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: file.contentsId,
        size: file.size,
        type: file.type,
        path: file.path,
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

  moveTo(folder: Folder, trackerId: string): void {
    if (this.folderId === folder.id) {
      throw new FileCannotBeMovedToTheOriginalFolderError(this.path);
    }

    this._folderId = folder.id;
    this._path = this._path.changeFolder(folder.path);

    this.record(
      new FileMovedDomainEvent({
        aggregateId: this._contentsId.value,
        trackerId,
      })
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
        aggregateId: this.contentsId,
        oldName: currentName,
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

  attributes(): FileAttributes {
    return {
      id: this.id,
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
