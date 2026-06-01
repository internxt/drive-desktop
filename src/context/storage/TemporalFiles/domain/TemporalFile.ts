import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { TemporalFilePath } from './TemporalFilePath';
import { TemporalFileSize } from './TemporalFileSize';
export type TemporalFileAttributes = {
  createdAt: Date;
  modifiedAt: Date;
  path: string;
  size: number;
  contentFilePath?: string;
};

/**
 * A temporal file is a local staging copy of a file the user is creating/writing on the virtual drive.
 *
 * When a user drops a file into the Internxt Drive folder (e.g. via Nautilus drag & drop),
 * it is stored temporarily at `/tmp/internxt-drive-tmp/{uuid}` while being written.
 * Once the file descriptor is closed (FUSE release), the temporal file is uploaded to the cloud
 * (see {@link TemporalFileUploader}) and then deleted from disk (see {@link DeleteTemporalFileOnFileCreated}).
 *
 * Auxiliary files (lock files, .tmp, vim swap, vim probe/backup files, .goutputstream-*) are ignored.
 */
export class TemporalFile extends AggregateRoot {
  private static readonly TEMPORAL_EXTENSION = 'tmp';
  private static readonly LOCK_FILE_NAME_PREFIX = '.~lock.';
  private static readonly OUTPUT_STREAM_NAME_PREFIX = '.goutputstream-';
  private static readonly VIM_SWAP_FILE_PATTERN = /\.sw[a-z]$/i;
  private static readonly VIM_BACKUP_FILE_SUFFIX = '~';
  private static readonly VIM_PROBE_FILE_NAME = '4913';

  private constructor(
    private _createdAt: Date,
    private _path: TemporalFilePath,
    private _size: TemporalFileSize,
    private readonly _modifiedTime: Date,
    private readonly _contentFilePath?: string,
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

  public get nameWithExtension() {
    return this._path.nameWithExtension();
  }

  public get extension() {
    return this._path.extension();
  }

  public get modifiedTime() {
    return this._modifiedTime;
  }

  public get contentFilePath() {
    return this._contentFilePath;
  }

  static create(path: TemporalFilePath, size: TemporalFileSize): TemporalFile {
    const createdAt = new Date();

    const file = new TemporalFile(createdAt, path, size, createdAt);

    return file;
  }

  static isTemporaryPath(pathString: string): boolean {
    try {
      const path = new TemporalFilePath(pathString);
      const file = new TemporalFile(new Date(), path, new TemporalFileSize(0), new Date());
      return file.isAuxiliary();
    } catch {
      return false;
    }
  }

  static from(attributes: TemporalFileAttributes): TemporalFile {
    return new TemporalFile(
      attributes.createdAt,
      new TemporalFilePath(attributes.path),
      new TemporalFileSize(attributes.size),
      attributes.modifiedAt,
      attributes.contentFilePath,
    );
  }

  increaseSizeBy(bytes: number): void {
    this._size = this._size.increment(bytes);
  }

  isAuxiliary(): boolean {
    const isLockFile = this.isLockFile();
    const isTemporal = this.isTemporal();
    const isOutputStream = this.isOutputStream();
    const isVimSwap = this.isVimSwapFile();
    const isVimBackup = this.isVimBackupFile();
    const isVimProbe = this.isVimProbeFile();

    return isLockFile || isTemporal || isOutputStream || isVimSwap || isVimBackup || isVimProbe;
  }

  isLockFile(): boolean {
    return this.nameWithExtension.startsWith(TemporalFile.LOCK_FILE_NAME_PREFIX);
  }

  isTemporal(): boolean {
    return this.extension === TemporalFile.TEMPORAL_EXTENSION;
  }

  isOutputStream(): boolean {
    return this.nameWithExtension.startsWith(TemporalFile.OUTPUT_STREAM_NAME_PREFIX);
  }

  isVimSwapFile(): boolean {
    return TemporalFile.VIM_SWAP_FILE_PATTERN.test(this.nameWithExtension);
  }

  isVimBackupFile(): boolean {
    return this.nameWithExtension.endsWith(TemporalFile.VIM_BACKUP_FILE_SUFFIX);
  }

  isVimProbeFile(): boolean {
    return this.nameWithExtension === TemporalFile.VIM_PROBE_FILE_NAME;
  }

  attributes(): TemporalFileAttributes {
    return {
      createdAt: this._createdAt,
      modifiedAt: this._modifiedTime,
      path: this._path.value,
      size: this._size.value,
      contentFilePath: this._contentFilePath,
    };
  }
}
