import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { FilePath } from './FilePath';
import { FileSize } from './FileSize';
import { FileCreatedDomainEvent } from './FileCreatedDomainEvent';
import { FileCannotBeMovedToTheOriginalFolderError } from './errors/FileCannotBeMovedToTheOriginalFolderError';
import { FileActionOnlyCanAffectOneLevelError } from './errors/FileActionOnlyCanAffectOneLevelError';
import { FileNameShouldDifferFromOriginalError } from './errors/FileNameShouldDifferFromOriginalError';
import { FileActionCannotModifyExtension } from './errors/FileActionCannotModifyExtension';
import { FileDeletedDomainEvent } from './FileDeletedDomainEvent';

export type WebdavFileAtributes = {
  fileId: string;
  folderId: number;
  createdAt: string;
  modificationTime: string;
  path: string;
  size: number;
  updatedAt: string;
};

export class WebdavFile extends AggregateRoot {
  private constructor(
    public readonly fileId: string,
    private _folderId: number,
    private _path: FilePath,
    public readonly size: FileSize,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    super();
  }

  public get folderId() {
    return this._folderId;
  }

  public get path() {
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

  static from(attributes: WebdavFileAtributes): WebdavFile {
    return new WebdavFile(
      attributes.fileId,
      attributes.folderId,
      new FilePath(attributes.path),
      new FileSize(attributes.size),
      new Date(attributes.createdAt),
      new Date(attributes.updatedAt)
    );
  }

  static create(
    fileId: string,
    folder: WebdavFolder,
    size: number,
    path: FilePath
  ): WebdavFile {
    const file = new WebdavFile(
      fileId,
      folder.id,
      path,
      new FileSize(size),
      new Date(),
      new Date()
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: fileId,
        size,
        type: path.extension(),
      })
    );

    return file;
  }

  trash() {
    // TODO: update state when implemented
    this.record(
      new FileDeletedDomainEvent({
        aggregateId: this.fileId,
        size: this.size.value,
      })
    );
  }

  moveTo(folder: WebdavFolder): void {
    if (this.folderId === folder.id) {
      throw new FileCannotBeMovedToTheOriginalFolderError(this.path);
    }

    this._folderId = folder.id;
    this._path = this._path.changeFolder(folder.path);

    //TODO: record file moved event
  }

  clone(fileId: string, folderId: number, newPath: FilePath) {
    // if (!this._path.hasSameDirname(newPath)) {
    //   throw new FileActionOnlyCanAffectOneLevelError('clone');
    // }

    // if (this._path.hasSameName(newPath)) {
    //   throw new FileNameShouldDifferFromOriginalError('clone');
    // }

    const file = new WebdavFile(
      fileId,
      folderId,
      newPath,
      this.size,
      this.createdAt,
      new Date()
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: fileId,
        size: this.size.value,
        type: this._path.extension(),
      })
    );

    return file;
  }

  overwrite(fileId: string, folderId: number, newPath: FilePath) {
    const file = new WebdavFile(
      fileId,
      folderId,
      newPath,
      this.size,
      this.createdAt,
      new Date()
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: fileId,
        size: this.size.value,
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

    this._path = this._path.updateName(newPath.name());

    // TODO: record rename event
  }

  hasParent(id: number): boolean {
    return this.folderId === id;
  }

  isFolder(): this is WebdavFolder {
    return false;
  }

  isFile(): this is WebdavFile {
    return true;
  }

  toPrimitives() {
    return {
      fileId: this.fileId,
      folderId: this.folderId,
      createdAt: this.createdAt.getDate(),
      path: this._path.value,
      size: this.size.value,
      updatedAt: this.updatedAt.getDate(),
    };
  }
}
