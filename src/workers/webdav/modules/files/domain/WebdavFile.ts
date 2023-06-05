import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { FilePath } from './FilePath';
import { FileSize } from './FileSize';
import { FileCreatedDomainEvent } from './FileCreatedDomainEvent';

export type WebdavFileAtributes = {
  fileId: string;
  folderId: number;
  createdAt: string;
  modificationTime: string;
  name: string;
  path: string;
  size: number;
  type: string;
  updatedAt: string;
};

export class WebdavFile extends AggregateRoot {
  private constructor(
    public readonly fileId: string,
    public readonly folderId: number,
    public readonly name: string,
    public readonly path: FilePath,
    public readonly size: FileSize,
    public readonly type: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly modificationTime: Date
  ) {
    super();
  }

  static from(attributes: WebdavFileAtributes): WebdavFile {
    return new WebdavFile(
      attributes.fileId,
      attributes.folderId,
      attributes.name,
      new FilePath(attributes.path),
      new FileSize(attributes.size),
      attributes.type,
      new Date(attributes.createdAt),
      new Date(attributes.updatedAt),
      new Date(attributes.modificationTime)
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
      path.name(),
      path,
      new FileSize(size),
      path.extension(),
      new Date(),
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
      throw new Error('Cannot move a file to its current folder');
    }

    const basePath = folder.path.value;

    const name = this.type === '' ? this.name : `${this.name}.${this.type}`;

    const file = new WebdavFile(
      this.fileId,
      folder.id,
      this.name,
      FilePath.fromParts([basePath, name]),
      this.size,
      this.type,
      this.createdAt,
      this.updatedAt,
      this.modificationTime
    );

    return file;
  }

  clone(fileId: string, folderId: number, newPath: FilePath) {
    if (!this.path.hasSameDirname(newPath)) {
      throw new Error('A file rename should mantain the current estructure');
    }

    if (this.path.hasSameName(newPath)) {
      throw new Error('Cannot rename a file to the same name');
    }

    const newName = newPath.name();

    const file = new WebdavFile(
      fileId,
      folderId,
      newName,
      newPath,
      this.size,
      this.type,
      this.createdAt,
      new Date(),
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
      throw new Error('A file rename should mantain the current estructure');
    }

    if (newPath.extension() !== this.type) {
      throw new Error('A file reanme cannot change the extension');
    }

    if (this.path.hasSameName(newPath)) {
      throw new Error('Cannot rename a file to the same name');
    }

    const newName = newPath.name();

    return new WebdavFile(
      this.fileId,
      this.folderId,
      newName,
      newPath,
      this.size,
      this.type,
      this.createdAt,
      this.updatedAt,
      this.modificationTime
    );
  }

  override(file: WebdavFile, fileId: string) {
    if (this.name !== file.name) {
      throw new Error('Cannot replace file with diferent name');
    }

    if (!this.path.equals(file.path)) {
      throw new Error('Cannot replace file with diferent pathnames');
    }

    if (this.type !== file.type) {
      throw new Error('Cannot replace file with diferent types');
    }

    const replaced = new WebdavFile(
      fileId,
      this.folderId,
      this.name,
      this.path,
      file.size,
      this.type,
      file.createdAt,
      new Date(),
      new Date()
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
      modificationTime: this.modificationTime.getDate(),
      name: this.name,
      size: this.size.value,
      type: this.type,
      updatedAt: this.updatedAt.getDate(),
    };
  }
}
