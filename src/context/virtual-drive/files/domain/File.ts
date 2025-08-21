import { FolderUuid } from './../../folders/domain/FolderUuid';
import { FilePath } from './FilePath';
import { FileSize } from './FileSize';
import { FileStatus, FileStatuses } from './FileStatus';
import { FilePlaceholderId, createFilePlaceholderId } from './PlaceholderId';
import { FileContentsId } from './FileContentsId';
import { FileFolderId } from './FileFolderId';
import { FileUuid } from './FileUuid';

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
    return createFilePlaceholderId(this.uuid);
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

  changeContents(contentsId: FileContentsId, contentsSize: FileSize) {
    this._contentsId = contentsId;
    this._size = contentsSize;
  }

  hasStatus(status: FileStatuses): boolean {
    return this._status.is(status);
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
