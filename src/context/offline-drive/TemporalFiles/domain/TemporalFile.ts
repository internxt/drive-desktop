import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { TemporalFilePath } from './TemporalFilePath';
import { TemporalFileSize } from './TemporalFileSize';

export type TemporalFileAttributes = {
  createdAt: Date;
  modifiedAt: Date;
  path: string;
  size: number;
};

export class TemporalFile extends AggregateRoot {
  private static readonly TEMPORAL_EXTENSION = 'tmp';
  private static readonly LOCK_FILE_NAME_PREFIX = '.~lock.';
  private static readonly OUTPUT_STREAM_NAME_PREFIX = '.~lock.';

  private constructor(
    private _createdAt: Date,
    private _path: TemporalFilePath,
    private _size: TemporalFileSize,
    private readonly _modifiedTime: Date
  ) {
    super();
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

  public get modifiedTime() {
    return this._modifiedTime;
  }

  static create(path: TemporalFilePath, size: TemporalFileSize): TemporalFile {
    const createdAt = new Date();

    const file = new TemporalFile(createdAt, path, size, createdAt);

    return file;
  }

  static from(attributes: TemporalFileAttributes): TemporalFile {
    return new TemporalFile(
      attributes.createdAt,
      new TemporalFilePath(attributes.path),
      new TemporalFileSize(attributes.size),
      attributes.modifiedAt
    );
  }

  increaseSizeBy(bytes: number): void {
    this._size = this._size.increment(bytes);
  }

  isAuxiliary(): boolean {
    const isLockFile = this.isLockFile();
    const isTemporal = this.isTemporal();
    const isOutputStream = this.isOutputStream();

    return isLockFile || isTemporal || isOutputStream;
  }

  isLockFile(): boolean {
    return this.name.startsWith(TemporalFile.LOCK_FILE_NAME_PREFIX);
  }

  isTemporal(): boolean {
    return this.extension === TemporalFile.TEMPORAL_EXTENSION;
  }

  isOutputStream(): boolean {
    return this.name.startsWith(TemporalFile.OUTPUT_STREAM_NAME_PREFIX);
  }

  attributes(): TemporalFileAttributes {
    return {
      createdAt: this._createdAt,
      modifiedAt: this._modifiedTime,
      path: this._path.value,
      size: this._size.value,
    };
  }
}
