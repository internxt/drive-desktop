import path from 'path';
import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';

export type LocalFolderAttributes = {
  path: AbsolutePath;
  modificationTime: number;
};

export class LocalFolder extends AggregateRoot {
  private constructor(
    private _path: AbsolutePath,
    private _modificationTime: number,
  ) {
    super();
  }

  get path(): AbsolutePath {
    return this._path;
  }

  basedir(): string {
    const dirname = path.posix.dirname(this._path);
    if (dirname === '.') {
      return path.posix.sep;
    }

    return dirname;
  }

  static from(path: AbsolutePath, modificationTime: number): LocalFolder {
    return new LocalFolder(path, modificationTime);
  }

  attributes(): LocalFolderAttributes {
    return {
      path: this._path,
      modificationTime: this._modificationTime,
    };
  }
}
