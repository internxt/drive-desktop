import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { Folder } from '../../folders/domain/Folder';
import { FilePath } from './FilePath';
import { FileSize } from './FileSize';
import { FileCreatedDomainEvent } from './FileCreatedDomainEvent';
import { FileCannotBeMovedToTheOriginalFolderError } from './errors/FileCannotBeMovedToTheOriginalFolderError';
import { FileNameShouldDifferFromOriginalError } from './errors/FileNameShouldDifferFromOriginalError';
import { FileActionCannotModifyExtension } from './errors/FileActionCannotModifyExtension';
import { FileDeletedDomainEvent } from './FileDeletedDomainEvent';
import { FileStatus, FileStatuses } from './FileStatus';
import { ContentsId } from '../../contents/domain/ContentsId';

export type FileAtributes = {
  name: string;
  type: string;
  contentsId: string;
  folderId: number;
  createdAt: string;
  modificationTime: string;
  size: number;
  updatedAt: string;
  status: string;
};

export class File extends AggregateRoot {
  private constructor(
    private _contentsId: ContentsId,
    private _name: string,
    private _type: string,
    private _folderId: number,
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

  public get name(): FileAtributes['name'] {
    return this._name;
  }

  public get extension(): FileAtributes['type'] {
    return this._type;
  }

  public get nameWithExtension(): string {
    return `${this.name}.${this.extension}`;
  }

  public get size(): number {
    return this._size.value;
  }

  public get status() {
    return this._status;
  }

  static from(attributes: FileAtributes): File {
    return new File(
      new ContentsId(attributes.contentsId),
      attributes.name,
      attributes.type,
      attributes.folderId,
      new FileSize(attributes.size),
      new Date(attributes.createdAt),
      new Date(attributes.updatedAt),
      FileStatus.fromValue(attributes.status)
    );
  }

  static create(
    contentsId: string,
    folder: Folder,
    size: number,
    path: FilePath
  ): File {
    const file = new File(
      new ContentsId(contentsId),
      path.name(),
      path.extension(),
      folder.id,
      new FileSize(size),
      new Date(),
      new Date(),
      FileStatus.Exists
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: contentsId,
        size,
        type: file.extension,
      })
    );

    return file;
  }

  trash() {
    this._status = this._status.changeTo(FileStatuses.TRASHED);

    this.record(
      new FileDeletedDomainEvent({
        aggregateId: this.contentsId,
        size: this._size.value,
      })
    );
  }

  moveTo(folder: Folder): void {
    if (this.folderId === folder.id) {
      throw new FileCannotBeMovedToTheOriginalFolderError(
        this.nameWithExtension
      );
    }

    this._folderId = folder.id;

    //TODO: record file moved event
  }

  clone(contentsId: string, folderId: number) {
    const file = new File(
      new ContentsId(contentsId),
      this.name,
      this.extension,
      folderId,
      this._size,
      this.createdAt,
      new Date(),
      FileStatus.Exists
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: contentsId,
        size: this._size.value,
        type: this.extension,
      })
    );

    return file;
  }

  overwrite(contentsId: string, folderId: number) {
    const file = new File(
      new ContentsId(contentsId),
      this.name,
      this.extension,
      folderId,
      this._size,
      this.createdAt,
      new Date(),
      FileStatus.Exists
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: contentsId,
        size: this._size.value,
        type: this.extension,
      })
    );

    return file;
  }

  rename(to: FilePath) {
    if (to.extension() !== this.extension) {
      throw new FileActionCannotModifyExtension('rename');
    }

    if (to.name() === this.name) {
      throw new FileNameShouldDifferFromOriginalError('rename');
    }

    this._name = to.name();

    // TODO: record rename event
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

  toPrimitives(): Omit<FileAtributes, 'modificationTime'> {
    return {
      contentsId: this.contentsId,
      name: this.name,
      type: this.extension,
      folderId: this.folderId,
      size: this._size.value,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      status: this.status.value,
    };
  }

  attributes(): FileAtributes {
    return {
      contentsId: this.contentsId,
      name: this.name,
      type: this.extension,
      folderId: this.folderId,
      createdAt: this.createdAt.toISOString(),
      size: this._size.value,
      updatedAt: this.updatedAt.toISOString(),
      status: this.status.value,
      modificationTime: this.updatedAt.toISOString(),
    };
  }
}
