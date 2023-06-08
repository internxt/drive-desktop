import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { FilePath } from './FilePath';
import { FileSize } from './FileSize';
import { FileCreatedDomainEvent } from './FileCreatedDomainEvent';
import { FileCannotBeMovedToTheOriginalFolderError } from './errors/FileCannotBeMovedToTheOriginalFolderError';
import { FileActionOnlyCanAffectOneLevelError } from './errors/FileActionOnlyCanAffectOneLevelError';
import { FileNameShouldDifferFromOriginalError } from './errors/FileNameShouldDifferFromOriginalError';
import { FileActionCannotModifyExtension } from './errors/FileActionCannotModifyExtension';
import { FileNameShouldBeEqualToOriginalError } from './errors/FileNameShouldBeEqualToOriginalError';

export type WebdavFileAtributes = {
  fileId: string;
  folderId: number;
  createdAt: string;
  modificationTime: string;
  path: string;
  size: number;
  type: string;
  updatedAt: string;
};

export class WebdavFile extends AggregateRoot {
  private constructor(
    public readonly fileId: string,
    public readonly folderId: number,
    public readonly path: FilePath,
    public readonly size: FileSize,
    public readonly type: string,
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
      attributes.type,
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
      path.extension(),
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

    // const name = this.type === '' ? this.name : `${this.name}.${this.type}`;

    const file = new WebdavFile(
      this.fileId,
      folder.id,
      FilePath.fromParts([basePath, this.path.name()]),
      this.size,
      this.type,
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

    const newName = newPath.name();

    const file = new WebdavFile(
      fileId,
      folderId,
      newPath,
      this.size,
      this.type,
      this.createdAt,
      new Date()
    );

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: fileId,
        size: this.size.value,
        type: this.type,
      })
    );

    return file;
  }

  rename(newPath: FilePath) {
    if (!this.path.hasSameDirname(newPath)) {
      throw new FileActionOnlyCanAffectOneLevelError('rename');
    }

    if (newPath.extension() !== this.type) {
      throw new FileActionCannotModifyExtension('rename');
    }

    if (this.path.hasSameName(newPath)) {
      throw new FileNameShouldDifferFromOriginalError('rename');
    }

    const newName = newPath.name();

    return new WebdavFile(
      this.fileId,
      this.folderId,
      newPath,
      this.size,
      this.type,
      this.createdAt,
      this.updatedAt
    );
  }

  overwrite(file: WebdavFile, fileId: string) {
    if (this.path.equals(file.path)) {
      throw new FileNameShouldBeEqualToOriginalError('overwrite');
    }

    if (!this.path.equals(file.path)) {
      throw new FileActionOnlyCanAffectOneLevelError('overwrite');
    }

    if (this.type !== file.type) {
      throw new FileActionCannotModifyExtension('overwrite');
    }

    const replaced = new WebdavFile(
      fileId,
      this.folderId,
      this.path,
      file.size,
      this.type,
      file.createdAt,
      new Date()
    );

    replaced.record(
      new FileCreatedDomainEvent({
        aggregateId: fileId,
        size: file.size.value,
        type: file.type,
      })
    );

    replaced.record(
      new FileCreatedDomainEvent({
        aggregateId: this.fileId,
        size: this.size.value,
        type: this.type,
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
      type: this.type,
      updatedAt: this.updatedAt.getDate(),
    };
  }
}
