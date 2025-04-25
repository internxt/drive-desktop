import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';

export type LocalFolderAttributes = {
  path: AbsolutePath;
  modificationTime: number;
};

export class LocalFolder {
  private constructor(
    private _path: AbsolutePath,
    private _modificationTime: number,
  ) {}

  get path(): AbsolutePath {
    return this._path;
  }

  static from(attributes: LocalFolderAttributes): LocalFolder {
    return new LocalFolder(attributes.path, attributes.modificationTime);
  }

  attributes(): LocalFolderAttributes {
    return {
      path: this._path,
      modificationTime: this._modificationTime,
    };
  }
}
