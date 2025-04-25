import { FolderUuid } from './../../folders/domain/FolderUuid';
import { Folder } from '../../folders/domain/Folder';
import { FilePath } from './FilePath';
import { FileSize } from './FileSize';
import { FileActionOnlyCanAffectOneLevelError } from './errors/FileActionOnlyCanAffectOneLevelError';
import { FileNameShouldDifferFromOriginalError } from './errors/FileNameShouldDifferFromOriginalError';
import { FileActionCannotModifyExtension } from './errors/FileActionCannotModifyExtension';
import { FileStatus, FileStatuses } from './FileStatus';
import { FilePlaceholderId, createFilePlaceholderId } from './PlaceholderId';
import { FileContentsId } from './FileContentsId';
import { FileFolderId } from './FileFolderId';
import { FileUuid } from './FileUuid';
import crypt from '@/context/shared/infrastructure/crypt';

export type FileAttributes = {
  id: number;
  uuid?: string;
  contentsId: string;
  folderId: number;
  folderUuid?: string;
  createdAt: string;
  modificationTime: string;
  path: string;
  size: number;
  updatedAt: string;
  status: string;
};

export class File {
  private constructor(
    private _id: number,
    private _uuid: FileUuid,
    private _contentsId: FileContentsId,
    private _folderId: FileFolderId,
    private _folderUuid: FolderUuid | undefined,
    private _path: FilePath,
    private _size: FileSize,
    public createdAt: Date,
    public updatedAt: Date,
    private _status: FileStatus,
  ) {}

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
    return this._folderId;
  }

  public get folderUuid() {
    return this._folderUuid;
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
      attributes.id ?? 0,
      new FileUuid(attributes.uuid ?? ''),
      new FileContentsId(attributes.contentsId),
      new FileFolderId(attributes.folderId),
      attributes.folderUuid ? new FolderUuid(attributes.folderUuid) : undefined,
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
      new FileUuid(attributes.uuid || ''),
      new FileContentsId(attributes.contentsId),
      new FileFolderId(attributes.folderId),
      attributes.folderUuid ? new FolderUuid(attributes.folderUuid) : undefined,
      new FilePath(attributes.path),
      new FileSize(attributes.size),
      new Date(attributes.createdAt),
      new Date(attributes.updatedAt),
      FileStatus.Exists,
    );

    return file;
  }

  static decryptName({
    plainName,
    name,
    parentId,
    type,
  }: {
    plainName?: string | null;
    name: string;
    parentId: number | null;
    type: string | null;
  }) {
    const decryptedName = plainName || crypt.decryptName({ name, parentId });
    if (type) return `${decryptedName}.${type}`;
    return decryptedName;
  }

  changeContents(contentsId: FileContentsId, contentsSize: FileSize) {
    this._contentsId = contentsId;
    this._size = contentsSize;
  }

  trash() {
    this._status = this._status.changeTo(FileStatuses.TRASHED);
    this.updatedAt = new Date();
  }

  moveTo(folder: Folder): void {
    this._folderId = new FileFolderId(folder.id);
    this._folderUuid = new FolderUuid(folder.uuid);
    this._path = this._path.changeFolder(folder.path);
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
  }

  hasParent(id: number): boolean {
    return this.folderId === new FileFolderId(id);
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

  replaceContestsAndSize(contentsId: string, size: number) {
    this._contentsId = new FileContentsId(contentsId);
    this._size = new FileSize(size);
    this.updatedAt = new Date();

    return this;
  }

  attributes(): FileAttributes {
    return {
      id: this._id,
      uuid: this._uuid.value,
      contentsId: this.contentsId,
      folderId: Number(this.folderId),
      folderUuid: this.folderUuid?.value,
      createdAt: this.createdAt.toISOString(),
      path: this.path,
      size: this.size,
      updatedAt: this.updatedAt.toISOString(),
      status: this.status.value,
      modificationTime: this.updatedAt.toISOString(),
    };
  }
}
