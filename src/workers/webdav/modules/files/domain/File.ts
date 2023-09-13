import { ContentsId } from '../../contents/domain/ContentsId';
import { Folder } from '../../folders/domain/Folder';
import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { ThumbnailContentId } from '../../thumbnails/domain/ThumbanailContentId';
import { FileCreatedDomainEvent } from './FileCreatedDomainEvent';
import { FileDeletedDomainEvent } from './FileDeletedDomainEvent';
import { FilePath } from './FilePath';
import { FileSize } from './FileSize';
import { FileStatus, FileStatuses } from './FileStatus';
import { FileActionCannotModifyExtension } from './errors/FileActionCannotModifyExtension';
import { FileActionOnlyCanAffectOneLevelError } from './errors/FileActionOnlyCanAffectOneLevelError';
import { FileCannotBeMovedToTheOriginalFolderError } from './errors/FileCannotBeMovedToTheOriginalFolderError';
import { FileNameShouldDifferFromOriginalError } from './errors/FileNameShouldDifferFromOriginalError';

export type FileAtributes = {
  contentsId: string;
  folderId: number;
  createdAt: string;
  modificationTime: string;
  path: string;
  size: number;
  updatedAt: string;
  status: string;
  thumbnailContentsIds: Array<string>;
};

export class File extends AggregateRoot {
  private constructor(
    private _contentsId: ContentsId,
    private _folderId: number,
    private _path: FilePath,
    private readonly _size: FileSize,
    public createdAt: Date,
    public updatedAt: Date,
    private _status: FileStatus,
    private _thumbnailContentsIds: Array<ThumbnailContentId>
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

  public get thumbnailContentsIds(): Array<string> {
    return this._thumbnailContentsIds.map((vo) => vo.value);
  }

  static from(attributes: FileAtributes): File {
    return new File(
      new ContentsId(attributes.contentsId),
      attributes.folderId,
      new FilePath(attributes.path),
      new FileSize(attributes.size),
      new Date(attributes.createdAt),
      new Date(attributes.updatedAt),
      FileStatus.fromValue(attributes.status),
      attributes.thumbnailContentsIds.map(
        (value) => new ThumbnailContentId(value)
      )
    );
  }

  static create(
    contentsId: string,
    folder: Folder,
    size: FileSize,
    path: FilePath
  ): File {
    const file = new File(
      new ContentsId(contentsId),
      folder.id,
      path,
      size,
      new Date(),
      new Date(),
      FileStatus.Exists,
      []
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: contentsId,
        size: file.size,
        type: path.extension(),
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
      throw new FileCannotBeMovedToTheOriginalFolderError(this.path.value);
    }

    this._folderId = folder.id;
    this._path = this._path.changeFolder(folder.path.value);

    //TODO: record file moved event
  }

  clone(contentsId: string, folderId: number, newPath: FilePath) {
    const file = new File(
      new ContentsId(contentsId),
      folderId,
      newPath,
      this._size,
      this.createdAt,
      new Date(),
      FileStatus.Exists,
      []
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: contentsId,
        size: this._size.value,
        type: this._path.extension(),
      })
    );

    return file;
  }

  overwrite(contentsId: string, folderId: number, newPath: FilePath) {
    const file = new File(
      new ContentsId(contentsId),
      folderId,
      newPath,
      this._size,
      this.createdAt,
      new Date(),
      FileStatus.Exists,
      []
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: contentsId,
        size: this._size.value,
        type: this._path.extension(),
      })
    );

    return file;
  }

  rename(newPath: FilePath) {
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

  update(
    attributes: Partial<
      Pick<
        FileAtributes,
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

  toPrimitives(): Omit<FileAtributes, 'modificationTime'> {
    return {
      contentsId: this.contentsId,
      folderId: this.folderId,
      path: this._path.value,
      size: this._size.value,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      status: this.status.value,
      thumbnailContentsIds: this.thumbnailContentsIds,
    };
  }

  attributes(): FileAtributes {
    return {
      contentsId: this.contentsId,
      folderId: this.folderId,
      createdAt: this.createdAt.toISOString(),
      path: this._path.value,
      size: this._size.value,
      updatedAt: this.updatedAt.toISOString(),
      status: this.status.value,
      modificationTime: this.updatedAt.toISOString(),
      thumbnailContentsIds: this.thumbnailContentsIds,
    };
  }
}
