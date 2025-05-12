import path from 'path';
import { AbsolutePath, RelativePath } from '../infrastructure/AbsolutePath';
import { LocalFileSize } from './LocalFileSize';

type LocalFileAttributes = {
  relativePath: RelativePath;
  path: AbsolutePath;
  modificationTime: number;
  size: number;
};

export class LocalFile {
  private constructor(
    private _path: AbsolutePath,
    private _modificationTime: number,
    private _size: LocalFileSize,
    public readonly relativePath: RelativePath,
  ) {}

  get path(): AbsolutePath {
    return this._path;
  }

  get modificationTime(): number {
    return this._modificationTime;
  }

  get size(): number {
    return this._size.value;
  }

  holdsSubpath(otherPath: string): boolean {
    return this._path.endsWith(otherPath);
  }

  isSmall(): boolean {
    return this._size.isSmall();
  }

  isMedium(): boolean {
    return this._size.isMedium();
  }

  isBig(): boolean {
    return this._size.isBig();
  }

  basedir(): string {
    const dirname = path.posix.dirname(this._path);
    if (dirname === '.') {
      return path.posix.sep;
    }

    return dirname;
  }

  nameWithExtension() {
    const basename = path.posix.basename(this._path);
    const { base } = path.posix.parse(basename);
    return base;
  }

  static from(attributes: LocalFileAttributes): LocalFile {
    return new LocalFile(attributes.path, attributes.modificationTime, new LocalFileSize(attributes.size), attributes.relativePath);
  }
}
