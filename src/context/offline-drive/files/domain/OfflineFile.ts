import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { OfflineFileId } from './OfflineFileId';
import { OfflineFilePath } from './OfflineFilePath';
import { OfflineFileSize } from './OfflineFileSize';

export type OfflineFileAttributes = {
  id: string;
  createdAt: Date;
  path: string;
  size: number;
};

export class OfflineFile extends AggregateRoot {
  private static readonly TEMPORAL_EXTENSION = 'tmp';
  private static readonly LOCK_FILE_NAME_PREFIX = '.~lock.';

  private constructor(
    private _id: OfflineFileId,
    private _createdAt: Date,
    private _path: OfflineFilePath,
    private _size: OfflineFileSize
  ) {
    super();
  }

  public get id() {
    return this._id;
  }
  public get createdAt() {
    return this._createdAt;
  }
  public get path() {
    return this._path;
  }
  public get size() {
    return this._size;
  }

  public get name() {
    return this._path.name();
  }

  public get extension() {
    return this._path.extension();
  }

  static create(path: OfflineFilePath, size: OfflineFileSize): OfflineFile {
    const id = OfflineFileId.create();
    const createdAt = new Date();

    const file = new OfflineFile(id, createdAt, path, size);

    return file;
  }

  static from(attributes: OfflineFileAttributes): OfflineFile {
    return new OfflineFile(
      new OfflineFileId(attributes.id),
      attributes.createdAt,
      new OfflineFilePath(attributes.path),
      new OfflineFileSize(attributes.size)
    );
  }

  increaseSizeBy(bytes: number): void {
    this._size = this._size.increment(bytes);
  }

  isAuxiliary(): boolean {
    const isLockFile = this.isLockFile();
    const isTemporal = this.isTemporal();

    return isLockFile || isTemporal;
  }

  isLockFile(): boolean {
    return this.name.startsWith(OfflineFile.LOCK_FILE_NAME_PREFIX);
  }

  isTemporal(): boolean {
    return this.extension === OfflineFile.TEMPORAL_EXTENSION;
  }

  attributes(): OfflineFileAttributes {
    return {
      id: this._id.value,
      createdAt: this._createdAt,
      path: this._path.value,
      size: this._size.value,
    };
  }
}
