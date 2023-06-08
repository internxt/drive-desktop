import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { FilePath } from './FilePath';
import { FileSize } from './FileSize';
import { FileCreatedDomainEvent } from './FileCreatedDomainEvent';
import { FileCannotBeMovedToTheOriginalFolderError } from './errors/FileCannotBeMovedToTheOriginalFolderError';
import { FileActionOnlyCanAffectOneLevelError } from './errors/FileActionOnlyCanAffectOneLevelError';
import { FileNameShouldDifferFromOriginalError } from './errors/FileNameShouldDifferFromOriginalError';
import { FileActionCannotModifyExtension } from './errors/FileActionCannotModifyExtension';

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
    public readonly folderId: number,
    public readonly path: FilePath,
    public readonly size: FileSize,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    super();
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

  moveTo(folder: WebdavFolder): WebdavFile {
    if (this.folderId === folder.id) {
      throw new FileCannotBeMovedToTheOriginalFolderError(this.path.value);
    }

    const basePath = folder.path.value;

    const file = new WebdavFile(
      this.fileId,
      folder.id,
      FilePath.fromParts([basePath, this.path.nameWithExtension()]),
      this.size,
      this.createdAt,
      this.updatedAt
    );

    return file;
  }

  clone(fileId: string, folderId: number, newPath: FilePath) {
    if (!this.path.hasSameDirname(newPath)) {
      throw new FileActionOnlyCanAffectOneLevelError('clone');
    }

    if (this.path.hasSameName(newPath)) {
      throw new FileNameShouldDifferFromOriginalError('clone');
    }

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
        type: this.path.extension(),
      })
    );

    return file;
  }

  rename(newPath: FilePath) {
    if (!this.path.hasSameDirname(newPath)) {
      throw new FileActionOnlyCanAffectOneLevelError('rename');
    }

    if (!newPath.hasSameExtension(this.path)) {
      throw new FileActionCannotModifyExtension('rename');
    }

    if (this.path.hasSameName(newPath)) {
      throw new FileNameShouldDifferFromOriginalError('rename');
    }

    return new WebdavFile(
      this.fileId,
      this.folderId,
      newPath,
      this.size,
      this.createdAt,
      this.updatedAt
    );
  }

  overwrite(file: WebdavFile, fileId: string) {
    if (!this.path.equals(file.path)) {
      throw new FileActionOnlyCanAffectOneLevelError('overwrite');
    }

    if (!this.path.hasSameExtension(file.path)) {
      throw new FileActionCannotModifyExtension('overwrite');
    }

    const replaced = new WebdavFile(
      fileId,
      this.folderId,
      this.path,
      file.size,
      file.createdAt,
      new Date()
    );

    replaced.record(
      new FileCreatedDomainEvent({
        aggregateId: fileId,
        size: file.size.value,
        type: file.path.extension(),
      })
    );

    replaced.record(
      new FileCreatedDomainEvent({
        aggregateId: this.fileId,
        size: this.size.value,
        type: this.path.extension(),
      })
    );

    return replaced;
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
      path: this.path.value,
      size: this.size.value,
      updatedAt: this.updatedAt.getDate(),
    };
  }
}
